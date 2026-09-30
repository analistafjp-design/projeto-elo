import type { ClienteStatus } from "@/types";

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

export interface ResultadoParseAba {
  validos: ClienteImportadoLinha[];
  erros: ErroImportacaoLinha[];
  /** Erro que impede a leitura da aba inteira (ex.: nenhuma coluna de Matrícula encontrada). */
  erroGeral?: string;
}

export type ExcelWorkerRequest =
  | { type: "listarAbas"; id: number; buffer: ArrayBuffer }
  | { type: "parseAba"; id: number; buffer: ArrayBuffer; nomeAba: string };

export type ExcelWorkerResponse =
  | { type: "listarAbas"; id: number; nomesAbas: string[] }
  | { type: "listarAbas-erro"; id: number; motivo: string }
  | ({ type: "parseAba"; id: number } & ResultadoParseAba)
  | { type: "parseAba-erro"; id: number; motivo: string };
