export const APP_NAME = import.meta.env.VITE_APP_NAME || "ELO";
export const APP_SLOGAN = "Conectando equipes de campo e clientes.";

export const CLIENTE_STATUS = ["Ativo", "Inativo", "Em Negociação"] as const;
export type ClienteStatus = (typeof CLIENTE_STATUS)[number];

export const NEGOCIACAO_STATUS = [
  "Aguardando Pagamento",
  "Pago",
  "Vencido",
  "Em Acompanhamento",
] as const;
export type NegociacaoStatus = (typeof NEGOCIACAO_STATUS)[number];

export const NEGOCIACAO_STATUS_COLORS: Record<NegociacaoStatus, string> = {
  "Aguardando Pagamento": "bg-amber-100 text-amber-800 border-amber-300",
  Pago: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Vencido: "bg-red-100 text-red-800 border-red-300",
  "Em Acompanhamento": "bg-blue-100 text-blue-800 border-blue-300",
};

export const COMPROVANTE_TIPOS = ["Conta", "Comprovante"] as const;
export type ComprovanteTipo = (typeof COMPROVANTE_TIPOS)[number];

export const INTERACAO_TIPOS = ["Ligação", "WhatsApp", "Visita", "Negociação"] as const;
export type InteracaoTipo = (typeof INTERACAO_TIPOS)[number];

export const ALERTA_STATUS = ["Pendente", "Enviado", "Resolvido"] as const;
export type AlertaStatus = (typeof ALERTA_STATUS)[number];

export const PERFIS = ["administrador", "operador"] as const;
export type Perfil = (typeof PERFIS)[number];

export const ACCEPTED_FILE_TYPES = [".jpg", ".jpeg", ".png", ".pdf"];
export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_FILE_SIZE_MB = 10;

export const WHATSAPP_TEMPLATE = (nome: string, matricula: string, data: string) =>
  `Olá, ${nome}.\n\nIdentificamos que a negociação vinculada à matrícula ${matricula} possui vencimento em ${data}.\n\nCaso o pagamento já tenha sido realizado, favor encaminhar o comprovante.\n\nEquipe ELO.`;
