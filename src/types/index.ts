import type { Database } from "./database.types";

export type {
  Perfil,
  ClienteStatus,
  NegociacaoStatus,
  ComprovanteTipo,
  InteracaoTipo,
  AlertaStatus,
} from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Negociacao = Database["public"]["Tables"]["negociacoes"]["Row"];
export type Comprovante = Database["public"]["Tables"]["comprovantes"]["Row"];
export type Interacao = Database["public"]["Tables"]["interacoes"]["Row"];
export type Alerta = Database["public"]["Tables"]["alertas"]["Row"];
export type DashboardResumo = Database["public"]["Views"]["vw_dashboard_resumo"]["Row"];

export type ClienteInsert = Database["public"]["Tables"]["clientes"]["Insert"];
export type ClienteUpdate = Database["public"]["Tables"]["clientes"]["Update"];
export type NegociacaoInsert = Database["public"]["Tables"]["negociacoes"]["Insert"];
export type NegociacaoUpdate = Database["public"]["Tables"]["negociacoes"]["Update"];
export type ComprovanteInsert = Database["public"]["Tables"]["comprovantes"]["Insert"];
export type InteracaoInsert = Database["public"]["Tables"]["interacoes"]["Insert"];
export type AlertaRow = Database["public"]["Tables"]["alertas"]["Row"];

export interface AlertaComRelacoes extends Alerta {
  cliente?: Pick<Cliente, "id" | "nome" | "matricula" | "telefone"> | null;
  negociacao?: Pick<Negociacao, "id" | "valor_negociado" | "data_vencimento" | "status"> | null;
}

export interface NegociacaoComCliente extends Negociacao {
  cliente?: Pick<Cliente, "id" | "nome" | "matricula"> | null;
}

export interface ComprovanteComRelacoes extends Comprovante {
  cliente?: Pick<Cliente, "id" | "nome" | "matricula"> | null;
}

export interface OcrResultado {
  matricula?: string;
  nome?: string;
  valor?: number;
  dataVencimento?: string;
  textoCompleto: string;
  confianca: number;
}

export interface ClienteFiltros {
  busca?: string;
  matricula?: string;
  nome?: string;
  telefone?: string;
  endereco?: string;
  status?: string;
}
