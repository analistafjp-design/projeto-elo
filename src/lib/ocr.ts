import { createWorker } from "tesseract.js";
import type { OcrResultado } from "@/types";

let workerPromise: ReturnType<typeof createWorker> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("por");
  }
  return workerPromise;
}

/**
 * Processa uma imagem de conta/comprovante via Tesseract.js e tenta
 * extrair matrícula, nome, valor e data de vencimento por heurística
 * de regex sobre o texto reconhecido. O usuário sempre pode corrigir
 * manualmente os campos preenchidos no formulário.
 */
export async function processarOcr(
  imagem: File | Blob | string,
  onProgress?: (progresso: number) => void,
): Promise<OcrResultado> {
  const worker = await getWorker();

  if (onProgress) {
    worker.setParameters({});
  }

  const { data } = await worker.recognize(imagem);
  const texto = data.text ?? "";
  const confianca = data.confidence ?? 0;

  return {
    matricula: extrairMatricula(texto),
    nome: extrairNome(texto),
    valor: extrairValor(texto),
    dataVencimento: extrairData(texto),
    textoCompleto: texto,
    confianca,
  };
}

export async function encerrarOcr(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}

function extrairMatricula(texto: string): string | undefined {
  const padroes = [
    /matr[ií]cula[:\s]*n?[ºo°]?\s*([0-9./-]{4,20})/i,
    /n[ºo°]?\s*(?:do\s*)?cliente[:\s]*([0-9./-]{4,20})/i,
    /c[oó]digo[:\s]*([0-9./-]{4,20})/i,
  ];
  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) return match[1].replace(/[^\d]/g, "");
  }
  return undefined;
}

function extrairNome(texto: string): string | undefined {
  const padroes = [
    /(?:nome|cliente|titular)[:\s]+([A-ZÀ-Ú][A-Za-zÀ-ú\s]{4,60})/,
    /(?:sr\.?|sra\.?)\s+([A-ZÀ-Ú][A-Za-zÀ-ú\s]{4,60})/i,
  ];
  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) return match[1].trim().replace(/\s{2,}/g, " ");
  }
  return undefined;
}

function extrairValor(texto: string): number | undefined {
  const padroes = [
    /(?:total\s*a\s*pagar|valor\s*(?:total|a\s*pagar|da\s*conta)?)[:\s]*r?\$?\s*([\d.,]{2,15})/i,
    /r\$\s*([\d.,]{2,15})/i,
  ];
  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) {
      const numero = match[1]
        .replace(/\.(?=\d{3}(?:\D|$))/g, "")
        .replace(",", ".");
      const valor = parseFloat(numero);
      if (!Number.isNaN(valor) && valor > 0) return valor;
    }
  }
  return undefined;
}

function extrairData(texto: string): string | undefined {
  const padroes = [
    /vencimento[:\s]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i,
    /vence\s*em[:\s]*(\d{2}[/.-]\d{2}[/.-]\d{4})/i,
    /(\d{2}[/.-]\d{2}[/.-]\d{4})/,
  ];
  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) {
      const partes = match[1].split(/[/.-]/);
      if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      }
    }
  }
  return undefined;
}
