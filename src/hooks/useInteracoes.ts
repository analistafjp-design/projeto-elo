import { useCallback, useEffect, useState } from "react";
import * as interacoesService from "@/services/interacoesService";
import type { Interacao, InteracaoInsert } from "@/types";

export function useInteracoesPorCliente(clienteId: string | undefined) {
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await interacoesService.listarInteracoesPorCliente(clienteId);
      setInteracoes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar interações.");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const registrar = async (payload: InteracaoInsert) => {
    const nova = await interacoesService.registrarInteracao(payload);
    await carregar();
    return nova;
  };

  const excluir = async (id: string) => {
    await interacoesService.excluirInteracao(id);
    await carregar();
  };

  return { interacoes, loading, erro, recarregar: carregar, registrar, excluir };
}
