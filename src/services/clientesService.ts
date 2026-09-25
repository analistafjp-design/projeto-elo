import { supabase } from "@/lib/supabase";
import type { Cliente, ClienteFiltros, ClienteInsert, ClienteUpdate } from "@/types";

export async function listarClientes(filtros: ClienteFiltros = {}): Promise<Cliente[]> {
  let query = supabase.from("clientes").select("*").order("nome", { ascending: true });

  if (filtros.busca) {
    const termo = filtros.busca.trim();
    query = query.or(
      `nome.ilike.%${termo}%,matricula.ilike.%${termo}%,telefone.ilike.%${termo}%,endereco.ilike.%${termo}%`,
    );
  } else {
    if (filtros.matricula) query = query.ilike("matricula", `%${filtros.matricula}%`);
    if (filtros.nome) query = query.ilike("nome", `%${filtros.nome}%`);
    if (filtros.telefone) query = query.ilike("telefone", `%${filtros.telefone}%`);
    if (filtros.endereco) query = query.ilike("endereco", `%${filtros.endereco}%`);
  }

  if (filtros.status) query = query.eq("status", filtros.status as Cliente["status"]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buscarCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function criarCliente(payload: ClienteInsert): Promise<Cliente> {
  const { data, error } = await supabase.from("clientes").insert(payload).select().single();
  if (error) throw new Error(traduzirErroCliente(error.message));
  return data;
}

export async function atualizarCliente(id: string, payload: ClienteUpdate): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(traduzirErroCliente(error.message));
  return data;
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function traduzirErroCliente(message: string): string {
  if (message.includes("clientes_matricula_key")) {
    return "Já existe um cliente cadastrado com esta matrícula.";
  }
  return message;
}
