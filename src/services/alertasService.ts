import { supabase } from "@/lib/supabase";
import type { AlertaComRelacoes, AlertaStatus } from "@/types";

export async function listarAlertas(status?: AlertaStatus): Promise<AlertaComRelacoes[]> {
  let query = supabase
    .from("alertas")
    .select(
      "*, cliente:clientes(id, nome, matricula, telefone), negociacao:negociacoes(id, valor_negociado, data_vencimento, status)",
    )
    .order("data_alerta", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AlertaComRelacoes[];
}

export async function listarAlertasPorCliente(clienteId: string): Promise<AlertaComRelacoes[]> {
  const { data, error } = await supabase
    .from("alertas")
    .select("*, negociacao:negociacoes(id, valor_negociado, data_vencimento, status)")
    .eq("cliente_id", clienteId)
    .order("data_alerta", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AlertaComRelacoes[];
}

export async function atualizarStatusAlerta(id: string, status: AlertaStatus): Promise<void> {
  const { error } = await supabase.from("alertas").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function contarAlertasPendentes(): Promise<number> {
  const { count, error } = await supabase
    .from("alertas")
    .select("id", { count: "exact", head: true })
    .eq("status", "Pendente");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function gerarAlertasManualmente(): Promise<void> {
  const { error } = await supabase.rpc("gerar_alertas_vencimento");
  if (error) throw new Error(error.message);
}
