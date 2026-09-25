import { useEffect, useState } from "react";
import * as dashboardService from "@/services/dashboardService";
import type { DashboardResumo } from "@/types";
import type {
  ClientePorStatus,
  EvolucaoPagamento,
  NegociacaoPorMes,
  RecuperacaoMes,
} from "@/services/dashboardService";

interface DashboardData {
  resumo: DashboardResumo | null;
  negociacoesPorMes: NegociacaoPorMes[];
  recuperacaoReceita: RecuperacaoMes[];
  clientesPorStatus: ClientePorStatus[];
  evolucaoPagamentos: EvolucaoPagamento[];
}

export function useDashboard() {
  const [dados, setDados] = useState<DashboardData>({
    resumo: null,
    negociacoesPorMes: [],
    recuperacaoReceita: [],
    clientesPorStatus: [],
    evolucaoPagamentos: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const [resumo, negociacoesPorMes, recuperacaoReceita, clientesPorStatus, evolucaoPagamentos] =
          await Promise.all([
            dashboardService.buscarResumoDashboard(),
            dashboardService.buscarNegociacoesPorMes(),
            dashboardService.buscarRecuperacaoReceita(),
            dashboardService.buscarClientesPorStatus(),
            dashboardService.buscarEvolucaoPagamentos(),
          ]);

        if (!mounted) return;
        setDados({ resumo, negociacoesPorMes, recuperacaoReceita, clientesPorStatus, evolucaoPagamentos });
      } catch (err) {
        if (!mounted) return;
        setErro(err instanceof Error ? err.message : "Erro ao carregar dashboard.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    carregar();
    return () => {
      mounted = false;
    };
  }, []);

  return { ...dados, loading, erro };
}
