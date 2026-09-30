import type { Cliente, ClienteStatus } from "@/types";

const STATUS_VALIDOS: ClienteStatus[] = ["Ativo", "Inativo", "Em Negociação"];

export interface ClienteImportadoLinha {
  linha: number;
  matricula: string;
  nome: string;
  telefone?: string;
  endereco?: string;
  status: ClienteStatus;
}

export interface ErroImportacaoLinha {
  linha: number;
  motivo: string;
}

export interface ResultadoParseClientesExcel {
  validos: ClienteImportadoLinha[];
  erros: ErroImportacaoLinha[];
}

/**
 * Gera e baixa uma planilha .xlsx com os clientes informados (respeita o
 * que está sendo exibido na tela, incluindo filtros/busca aplicados).
 */
export async function exportarClientesParaExcel(clientes: Cliente[]): Promise<void> {
  const XLSX = await import("@e965/xlsx");

  const linhas = clientes.map((cliente) => ({
    Matrícula: cliente.matricula,
    Nome: cliente.nome,
    Telefone: cliente.telefone ?? "",
    Endereço: cliente.endereco ?? "",
    Status: cliente.status,
  }));

  const planilha = XLSX.utils.json_to_sheet(linhas, {
    header: ["Matrícula", "Nome", "Telefone", "Endereço", "Status"],
  });
  planilha["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 34 }, { wch: 16 }];

  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Clientes");

  const dataAtual = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(livro, `clientes-elo-${dataAtual}.xlsx`);
}

function normalizarStatus(valor: string): ClienteStatus | null {
  const texto = valor.trim();
  if (!texto) return "Ativo";
  return STATUS_VALIDOS.find((s) => s.toLowerCase() === texto.toLowerCase()) ?? null;
}

function obterCampo(linha: Record<string, unknown>, chaves: string[]): string {
  const chaveEncontrada = Object.keys(linha).find((k) =>
    chaves.includes(k.trim().toLowerCase()),
  );
  if (!chaveEncontrada) return "";
  const valor = linha[chaveEncontrada];
  return valor == null ? "" : String(valor).trim();
}

/**
 * Lê um arquivo .xlsx/.xls (colunas: Matrícula, Nome, Telefone, Endereço,
 * Status) e valida cada linha. Não grava nada no banco — apenas retorna o
 * resultado do parse, para que o usuário revise antes de confirmar a
 * importação.
 */
export async function parseClientesExcel(file: File): Promise<ResultadoParseClientesExcel> {
  const XLSX = await import("@e965/xlsx");

  const buffer = await file.arrayBuffer();
  const livro = XLSX.read(buffer, { type: "array" });
  const nomeAba = livro.SheetNames[0];

  if (!nomeAba) {
    return { validos: [], erros: [{ linha: 0, motivo: "A planilha está vazia." }] };
  }

  const aba = livro.Sheets[nomeAba];
  const linhasBrutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(aba, { defval: "" });

  const validos: ClienteImportadoLinha[] = [];
  const erros: ErroImportacaoLinha[] = [];

  linhasBrutas.forEach((linha, indice) => {
    const numeroLinha = indice + 2; // linha 1 é o cabeçalho

    const matricula = obterCampo(linha, ["matrícula", "matricula"]);
    const nome = obterCampo(linha, ["nome"]);
    const telefone = obterCampo(linha, ["telefone"]);
    const endereco = obterCampo(linha, ["endereço", "endereco"]);
    const statusTexto = obterCampo(linha, ["status"]);

    if (!matricula && !nome) return; // linha em branco, ignora

    if (!matricula) {
      erros.push({ linha: numeroLinha, motivo: "Matrícula não informada." });
      return;
    }
    if (!nome || nome.length < 3) {
      erros.push({ linha: numeroLinha, motivo: "Nome inválido ou não informado." });
      return;
    }
    const status = normalizarStatus(statusTexto);
    if (!status) {
      erros.push({
        linha: numeroLinha,
        motivo: `Status "${statusTexto}" inválido. Use Ativo, Inativo ou Em Negociação.`,
      });
      return;
    }

    validos.push({
      linha: numeroLinha,
      matricula,
      nome,
      telefone: telefone || undefined,
      endereco: endereco || undefined,
      status,
    });
  });

  return { validos, erros };
}
