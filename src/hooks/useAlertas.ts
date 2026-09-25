import { useCallback, useEffect, useState } from "react";
import * as alertasService from "@/services/alertasService";
import type { AlertaComRelacoes, AlertaStatus } from "@/types";

export function useAlertas(status?: AlertaStatus) {
  const [alertas, setAlertas] = useState<AlertaComRelacoes[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await alertasService.listarAlertas(status);
      setAlertas(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar alertas.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const marcarStatus = async (id: string, novoStatus: AlertaStatus) => {
    await alertasService.atualizarStatusAlerta(id, novoStatus);
    await carregar();
  };

  return { alertas, loading, erro, recarregar: carregar, marcarStatus };
}
