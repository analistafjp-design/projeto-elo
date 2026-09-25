import { supabase, COMPROVANTES_BUCKET } from "@/lib/supabase";
import type { Interacao, InteracaoInsert } from "@/types";

/**
 * As fotos de visita são armazenadas no mesmo bucket privado dos
 * comprovantes (reaproveitando a mesma política de RLS baseada na
 * pasta `{cliente_id}/...`), em uma subpasta própria "visitas/".
 * Retorna uma URL assinada de longa duração para exibição em
 * interacoes.foto_url.
 */
export async function uploadFotoVisita(clienteId: string, file: File): Promise<string> {
  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const caminho = `${clienteId}/visitas/${crypto.randomUUID()}.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from(COMPROVANTES_BUCKET)
    .upload(caminho, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase.storage
    .from(COMPROVANTES_BUCKET)
    .createSignedUrl(caminho, 60 * 60 * 24 * 365);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function listarInteracoesPorCliente(clienteId: string): Promise<Interacao[]> {
  const { data, error } = await supabase
    .from("interacoes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function registrarInteracao(payload: InteracaoInsert): Promise<Interacao> {
  const { data, error } = await supabase.from("interacoes").insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirInteracao(id: string): Promise<void> {
  const { error } = await supabase.from("interacoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listarInteracoesRecentes(limite = 60): Promise<
  (Interacao & { cliente?: { id: string; nome: string; matricula: string } | null })[]
> {
  const { data, error } = await supabase
    .from("interacoes")
    .select("*, cliente:clientes(id, nome, matricula)")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as (Interacao & {
    cliente?: { id: string; nome: string; matricula: string } | null;
  })[];
}
