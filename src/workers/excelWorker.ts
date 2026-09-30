/// <reference lib="webworker" />
import * as XLSX from "@e965/xlsx";
import type { ClienteStatus } from "@/types";
import type {
  ClienteImportadoLinha,
  ErroImportacaoLinha,
  ExcelWorkerRequest,
  ResultadoParseAba,
} from "@/lib/excelTypes";

const STATUS_VALIDOS: ClienteStatus[] = ["Ativo", "Inativo", "Em Negociação"];

// Nomes de coluna aceitos (comparados já sem acento e em minúsculo). Cobre
// tanto a planilha gerada pelo próprio ELO ("Matrícula", "Nome"...) quanto
// relatórios externos reais (ex.: "MATRICULA"/"CLIENTE" ou
// "NUM_LIGACAO"/"NOM_CLIENTE").
const ALIASES_MATRICULA = ["matricula", "num_ligacao", "numligacao", "codigo cliente", "cod cliente"];
const ALIASES_NOME = ["nome", "cliente", "nom_cliente", "razao social"];
const ALIASES_TELEFONE = ["telefone", "fone", "celular"];
const ALIASES_ENDERECO = ["endereco"];
const ALIASES_STATUS = ["status"];

const LINHAS_CABECALHO_PROCURADAS = 20;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function encontrarColuna(cabecalho: string[], aliases: string[]): number {
  const normalizado = cabecalho.map((c) => normalizar(c));
  for (const alias of aliases) {
    const idx = normalizado.findIndex((c) => c === alias || c.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Planilhas externas reais costumam ter uma coluna chamada "Status" com um
// significado completamente diferente do status do cliente no ELO (ex.:
// status de pagamento de uma fatura, como "Pago"). Em vez de rejeitar a
// linha inteira por causa disso, tratamos qualquer texto que não seja um
// dos três status reconhecidos da mesma forma que uma coluna vazia: usa
// "Ativo" como padrão (o usuário sempre pode ajustar o status depois,
// dentro do próprio sistema).
function normalizarStatus(valor: string): ClienteStatus {
  const texto = valor.trim();
  return STATUS_VALIDOS.find((s) => normalizar(s) === normalizar(texto)) ?? "Ativo";
}

function valorCelulaParaTexto(valor: unknown): string {
  if (valor == null) return "";
  if (typeof valor === "number") return String(valor);
  return String(valor).trim();
}

function detectarCabecalho(linhas: unknown[][]): { indice: number; colunas: string[] } | null {
  const limite = Math.min(LINHAS_CABECALHO_PROCURADAS, linhas.length);
  for (let i = 0; i < limite; i++) {
    const colunas = (linhas[i] ?? []).map((c) => valorCelulaParaTexto(c));
    if (encontrarColuna(colunas, ALIASES_MATRICULA) !== -1) {
      return { indice: i, colunas };
    }
  }
  return null;
}

function listarAbas(buffer: ArrayBuffer): string[] {
  const livro = XLSX.read(buffer, { type: "array", bookSheets: true });
  return livro.SheetNames;
}

function parseAba(buffer: ArrayBuffer, nomeAba: string): ResultadoParseAba {
  const livro = XLSX.read(buffer, { type: "array", sheets: [nomeAba] });
  const aba = livro.Sheets[nomeAba];
  if (!aba) {
    return { validos: [], erros: [], erroGeral: `A aba "${nomeAba}" não foi encontrada no arquivo.` };
  }

  const linhas = XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: "" });

  const cabecalho = detectarCabecalho(linhas);
  if (!cabecalho) {
    return {
      validos: [],
      erros: [],
      erroGeral:
        'Não encontramos uma coluna de "Matrícula" nesta aba. Verifique se escolheu a aba certa da planilha.',
    };
  }

  const colMatricula = encontrarColuna(cabecalho.colunas, ALIASES_MATRICULA);
  const colNome = encontrarColuna(cabecalho.colunas, ALIASES_NOME);
  const colTelefone = encontrarColuna(cabecalho.colunas, ALIASES_TELEFONE);
  const colEndereco = encontrarColuna(cabecalho.colunas, ALIASES_ENDERECO);
  const colStatus = encontrarColuna(cabecalho.colunas, ALIASES_STATUS);

  if (colNome === -1) {
    return {
      validos: [],
      erros: [],
      erroGeral:
        'Encontramos a coluna de Matrícula, mas nenhuma coluna de "Nome" ou "Cliente" nesta aba.',
    };
  }

  const validos: ClienteImportadoLinha[] = [];
  const erros: ErroImportacaoLinha[] = [];

  for (let i = cabecalho.indice + 1; i < linhas.length; i++) {
    const linha = linhas[i] ?? [];
    const numeroLinha = i + 1; // linha real da planilha (1-based)

    const matricula = valorCelulaParaTexto(linha[colMatricula]);
    const nome = valorCelulaParaTexto(linha[colNome]);
    const telefone = colTelefone !== -1 ? valorCelulaParaTexto(linha[colTelefone]) : "";
    const endereco = colEndereco !== -1 ? valorCelulaParaTexto(linha[colEndereco]) : "";
    const statusTexto = colStatus !== -1 ? valorCelulaParaTexto(linha[colStatus]) : "";

    if (!matricula && !nome) continue; // linha em branco

    if (!matricula) {
      erros.push({ linha: numeroLinha, motivo: "Matrícula não informada." });
      continue;
    }
    if (!nome || nome.length < 3) {
      erros.push({ linha: numeroLinha, motivo: "Nome inválido ou não informado." });
      continue;
    }
    validos.push({
      linha: numeroLinha,
      matricula,
      nome,
      telefone: telefone || undefined,
      endereco: endereco || undefined,
      status: normalizarStatus(statusTexto),
    });
  }

  return { validos, erros };
}

self.onmessage = (event: MessageEvent<ExcelWorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === "listarAbas") {
      const nomesAbas = listarAbas(msg.buffer);
      self.postMessage({ type: "listarAbas", id: msg.id, nomesAbas });
    } else if (msg.type === "parseAba") {
      const resultado = parseAba(msg.buffer, msg.nomeAba);
      self.postMessage({ type: "parseAba", id: msg.id, ...resultado });
    }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : "Erro desconhecido ao ler a planilha.";
    const tipoErro = msg.type === "listarAbas" ? "listarAbas-erro" : "parseAba-erro";
    self.postMessage({ type: tipoErro, id: msg.id, motivo });
  }
};
