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

      // Promise.allSettled: uma consulta que falhar não deve apagar as
      // demais que já tiverem carregado com sucesso — o dashboard mostra
      // o que conseguiu buscar em vez de ficar todo em branco.
      const [resumo, negociacoesPorMes, recuperacaoReceita, clientesPorStatus, evolucaoPagamentos] =
        await Promise.allSettled([
          dashboardService.buscarResumoDashboard(),
          dashboardService.buscarNegociacoesPorMes(),
          dashboardService.buscarRecuperacaoReceita(),
          dashboardService.buscarClientesPorStatus(),
          dashboardService.buscarEvolucaoPagamentos(),
        ]);

      if (!mounted) return;

      const falhas = [resumo, negociacoesPorMes, recuperacaoReceita, clientesPorStatus, evolucaoPagamentos].filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      if (falhas.length > 0) {
        // eslint-disable-next-line no-console
        console.error("Erro ao carregar parte do dashboard:", falhas.map((f) => f.reason));
        setErro("Alguns dados do dashboard não puderam ser carregados.");
      }

      setDados({
        resumo: resumo.status === "fulfilled" ? resumo.value : null,
        negociacoesPorMes: negociacoesPorMes.status === "fulfilled" ? negociacoesPorMes.value : [],
        recuperacaoReceita: recuperacaoReceita.status === "fulfilled" ? recuperacaoReceita.value : [],
        clientesPorStatus: clientesPorStatus.status === "fulfilled" ? clientesPorStatus.value : [],
        evolucaoPagamentos: evolucaoPagamentos.status === "fulfilled" ? evolucaoPagamentos.value : [],
      });
      setLoading(false);
    }

    carregar();
    return () => {
      mounted = false;
    };
  }, []);

  return { ...dados, loading, erro };
}
