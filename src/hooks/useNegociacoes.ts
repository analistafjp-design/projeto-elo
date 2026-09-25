import { useCallback, useEffect, useState } from "react";
import * as negociacoesService from "@/services/negociacoesService";
import type { Negociacao, NegociacaoInsert, NegociacaoUpdate } from "@/types";

export function useNegociacoesPorCliente(clienteId: string | undefined) {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await negociacoesService.listarNegociacoesPorCliente(clienteId);
      setNegociacoes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar negociações.");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = async (payload: NegociacaoInsert) => {
    const nova = await negociacoesService.criarNegociacao(payload);
    await carregar();
    return nova;
  };

  const atualizar = async (id: string, payload: NegociacaoUpdate) => {
    const atualizada = await negociacoesService.atualizarNegociacao(id, payload);
    await carregar();
    return atualizada;
  };

  const excluir = async (id: string) => {
    await negociacoesService.excluirNegociacao(id);
    await carregar();
  };

  return { negociacoes, loading, erro, recarregar: carregar, criar, atualizar, excluir };
}
