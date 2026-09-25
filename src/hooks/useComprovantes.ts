import { useCallback, useEffect, useState } from "react";
import * as comprovantesService from "@/services/comprovantesService";
import type { Comprovante, ComprovanteTipo } from "@/types";

export function useComprovantesPorCliente(clienteId: string | undefined) {
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await comprovantesService.listarComprovantesPorCliente(clienteId);
      setComprovantes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar comprovantes.");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const enviar = async (params: {
    negociacaoId?: string | null;
    tipo: ComprovanteTipo;
    file: File;
    criadoPor?: string | null;
  }) => {
    if (!clienteId) throw new Error("Cliente não informado.");
    setEnviando(true);
    try {
      const novo = await comprovantesService.uploadComprovante({ clienteId, ...params });
      await carregar();
      return novo;
    } finally {
      setEnviando(false);
    }
  };

  const excluir = async (comprovante: Comprovante) => {
    await comprovantesService.excluirComprovante(comprovante);
    await carregar();
  };

  return { comprovantes, loading, erro, enviando, recarregar: carregar, enviar, excluir };
}
