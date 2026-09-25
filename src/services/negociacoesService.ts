import { supabase } from "@/lib/supabase";
import type { Negociacao, NegociacaoInsert, NegociacaoUpdate, NegociacaoComCliente } from "@/types";

export async function listarNegociacoesPorCliente(clienteId: string): Promise<Negociacao[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarTodasNegociacoes(status?: string): Promise<NegociacaoComCliente[]> {
  let query = supabase
    .from("negociacoes")
    .select("*, cliente:clientes(id, nome, matricula)")
    .order("data_vencimento", { ascending: true });

  if (status) query = query.eq("status", status as Negociacao["status"]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as NegociacaoComCliente[];
}

export async function buscarNegociacao(id: string): Promise<Negociacao | null> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function criarNegociacao(payload: NegociacaoInsert): Promise<Negociacao> {
  const { data, error } = await supabase.from("negociacoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarNegociacao(
  id: string,
  payload: NegociacaoUpdate,
): Promise<Negociacao> {
  const { data, error } = await supabase
    .from("negociacoes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirNegociacao(id: string): Promise<void> {
  const { error } = await supabase.from("negociacoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
