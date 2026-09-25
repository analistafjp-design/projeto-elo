import { onlyDigits } from "./utils";
import { WHATSAPP_TEMPLATE } from "./constants";

export function montarLinkWhatsapp(params: {
  telefone: string;
  nome: string;
  matricula: string;
  dataVencimento: string;
}): string {
  const numero = onlyDigits(params.telefone);
  const numeroComDDI = numero.startsWith("55") ? numero : `55${numero}`;
  const mensagem = WHATSAPP_TEMPLATE(params.nome, params.matricula, params.dataVencimento);
  const mensagemCodificada = encodeURIComponent(mensagem);
  return `https://wa.me/${numeroComDDI}?text=${mensagemCodificada}`;
}

export function abrirWhatsapp(params: {
  telefone: string;
  nome: string;
  matricula: string;
  dataVencimento: string;
}): void {
  const link = montarLinkWhatsapp(params);
  window.open(link, "_blank", "noopener,noreferrer");
}
