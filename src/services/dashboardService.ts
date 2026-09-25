import { supabase } from "@/lib/supabase";
import type { DashboardResumo } from "@/types";

export async function buscarResumoDashboard(): Promise<DashboardResumo> {
  const { data, error } = await supabase.from("vw_dashboard_resumo").select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export interface NegociacaoPorMes {
  mes: string;
  quantidade: number;
  valor: number;
}

export async function buscarNegociacoesPorMes(): Promise<NegociacaoPorMes[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("created_at, valor_negociado")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, { quantidade: number; valor: number }>();
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" });

  for (const registro of data ?? []) {
    const data_ = new Date(registro.created_at);
    const chave = `${data_.getFullYear()}-${String(data_.getMonth() + 1).padStart(2, "0")}`;
    const atual = agrupado.get(chave) ?? { quantidade: 0, valor: 0 };
    atual.quantidade += 1;
    atual.valor += Number(registro.valor_negociado ?? 0);
    agrupado.set(chave, atual);

    void formatter;
  }

  return Array.from(agrupado.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([chave, valores]) => {
      const [ano, mes] = chave.split("-");
      const label = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { mes: label, ...valores };
    });
}

export interface RecuperacaoMes {
  mes: string;
  negociado: number;
  recuperado: number;
}

export async function buscarRecuperacaoReceita(): Promise<RecuperacaoMes[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("created_at, valor_negociado, status")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, { negociado: number; recuperado: number }>();

  for (const registro of data ?? []) {
    const data_ = new Date(registro.created_at);
    const chave = `${data_.getFullYear()}-${String(data_.getMonth() + 1).padStart(2, "0")}`;
    const atual = agrupado.get(chave) ?? { negociado: 0, recuperado: 0 };
    atual.negociado += Number(registro.valor_negociado ?? 0);
    if (registro.status === "Pago") atual.recuperado += Number(registro.valor_negociado ?? 0);
    agrupado.set(chave, atual);
  }

  return Array.from(agrupado.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([chave, valores]) => {
      const [ano, mes] = chave.split("-");
      const label = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { mes: label, ...valores };
    });
}

export interface ClientePorStatus {
  status: string;
  quantidade: number;
}

export async function buscarClientesPorStatus(): Promise<ClientePorStatus[]> {
  const { data, error } = await supabase.from("clientes").select("status");
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, number>();
  for (const registro of data ?? []) {
    agrupado.set(registro.status, (agrupado.get(registro.status) ?? 0) + 1);
  }
  return Array.from(agrupado.entries()).map(([status, quantidade]) => ({ status, quantidade }));
}

export interface EvolucaoPagamento {
  data: string;
  pagos: number;
}

export async function buscarEvolucaoPagamentos(): Promise<EvolucaoPagamento[]> {
  const { data, error } = await supabase
    .from("negociacoes")
    .select("updated_at, status")
    .eq("status", "Pago")
    .order("updated_at", { ascending: true });
  if (error) throw new Error(error.message);

  const agrupado = new Map<string, number>();
  for (const registro of data ?? []) {
    const data_ = new Date(registro.updated_at);
    const chave = data_.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    agrupado.set(chave, (agrupado.get(chave) ?? 0) + 1);
  }

  return Array.from(agrupado.entries())
    .slice(-14)
    .map(([data_, pagos]) => ({ data: data_, pagos }));
}
