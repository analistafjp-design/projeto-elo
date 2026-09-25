import { supabase, COMPROVANTES_BUCKET } from "@/lib/supabase";
import type { Comprovante, ComprovanteTipo } from "@/types";

export async function listarComprovantesPorCliente(clienteId: string): Promise<Comprovante[]> {
  const { data, error } = await supabase
    .from("comprovantes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarComprovantesRecentes(limite = 50): Promise<
  (Comprovante & { cliente?: { id: string; nome: string; matricula: string } | null })[]
> {
  const { data, error } = await supabase
    .from("comprovantes")
    .select("*, cliente:clientes(id, nome, matricula)")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as (Comprovante & {
    cliente?: { id: string; nome: string; matricula: string } | null;
  })[];
}

interface UploadComprovanteParams {
  clienteId: string;
  negociacaoId?: string | null;
  tipo: ComprovanteTipo;
  file: File;
  criadoPor?: string | null;
}

export async function uploadComprovante({
  clienteId,
  negociacaoId,
  tipo,
  file,
  criadoPor,
}: UploadComprovanteParams): Promise<Comprovante> {
  const extensao = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
  const caminho = `${clienteId}/${nomeArquivo}`;

  const { error: uploadError } = await supabase.storage
    .from(COMPROVANTES_BUCKET)
    .upload(caminho, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw new Error(uploadError.message);

  // O bucket "comprovantes" é privado: arquivo_url guarda uma referência
  // inicial, mas a exibição/download sempre deve usar obterUrlAssinada(),
  // que gera uma URL temporária válida respeitando a RLS do storage.
  const urlAssinadaInicial = await obterUrlAssinada(caminho).catch(() => caminho);

  const { data, error } = await supabase
    .from("comprovantes")
    .insert({
      cliente_id: clienteId,
      negociacao_id: negociacaoId ?? null,
      arquivo_url: urlAssinadaInicial,
      arquivo_path: caminho,
      tipo,
      created_by: criadoPor ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(COMPROVANTES_BUCKET).remove([caminho]);
    throw new Error(error.message);
  }

  return data;
}

export async function obterUrlAssinada(caminho: string, expiraEmSegundos = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(COMPROVANTES_BUCKET)
    .createSignedUrl(caminho, expiraEmSegundos);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function excluirComprovante(comprovante: Comprovante): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(COMPROVANTES_BUCKET)
    .remove([comprovante.arquivo_path]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("comprovantes").delete().eq("id", comprovante.id);
  if (error) throw new Error(error.message);
}
