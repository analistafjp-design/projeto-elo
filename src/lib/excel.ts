import type { Cliente } from "@/types";
import type { ExcelWorkerResponse, ResultadoParseAba } from "@/lib/excelTypes";

export type { ClienteImportadoLinha, ErroImportacaoLinha, ResultadoParseAba } from "@/lib/excelTypes";

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

let workerUnicoId = 0;

/**
 * A leitura de planilhas roda em um Web Worker (em vez do carregamento
 * principal da página) porque arquivos reais do dia a dia podem ser bem
 * mais pesados que uma simples lista de clientes — relatórios com várias
 * abas e dezenas de milhares de linhas levam alguns segundos para serem
 * lidos, e isso travaria a tela/o app durante esse tempo se rodasse na
 * thread principal.
 */
function criarWorker(): Worker {
  return new Worker(new URL("../workers/excelWorker.ts", import.meta.url), { type: "module" });
}

/** Lista os nomes das abas de um arquivo Excel (.xlsx/.xls), sem ler o conteúdo delas. */
export async function listarAbasExcel(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const worker = criarWorker();
  const id = ++workerUnicoId;

  try {
    return await new Promise<string[]>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<ExcelWorkerResponse>) => {
        const msg = event.data;
        if (msg.id !== id) return;
        if (msg.type === "listarAbas") resolve(msg.nomesAbas);
        else if (msg.type === "listarAbas-erro") reject(new Error(msg.motivo));
      };
      worker.onerror = (event) => reject(new Error(event.message || "Erro ao ler a planilha."));
      worker.postMessage({ type: "listarAbas", id, buffer }, [buffer]);
    });
  } finally {
    worker.terminate();
  }
}

/**
 * Lê e valida uma aba específica (colunas: Matrícula, Nome, Telefone,
 * Endereço, Status — aceita variações comuns como "Cliente" no lugar de
 * "Nome"). Não grava nada no banco — apenas retorna o resultado do parse,
 * para o usuário revisar antes de confirmar a importação.
 */
export async function parseAbaExcel(file: File, nomeAba: string): Promise<ResultadoParseAba> {
  const buffer = await file.arrayBuffer();
  const worker = criarWorker();
  const id = ++workerUnicoId;

  try {
    return await new Promise<ResultadoParseAba>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<ExcelWorkerResponse>) => {
        const msg = event.data;
        if (msg.id !== id) return;
        if (msg.type === "parseAba") resolve({ validos: msg.validos, erros: msg.erros, erroGeral: msg.erroGeral });
        else if (msg.type === "parseAba-erro") reject(new Error(msg.motivo));
      };
      worker.onerror = (event) => reject(new Error(event.message || "Erro ao ler a planilha."));
      worker.postMessage({ type: "parseAba", id, buffer, nomeAba }, [buffer]);
    });
  } finally {
    worker.terminate();
  }
}
