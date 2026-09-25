import { Users, Handshake, Wallet, TrendingUp, FileWarning, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";
import { NegociacoesPorMesChart } from "@/components/dashboard/NegociacoesPorMesChart";
import { RecuperacaoReceitaChart } from "@/components/dashboard/RecuperacaoReceitaChart";
import { ClientesPorStatusChart } from "@/components/dashboard/ClientesPorStatusChart";
import { EvolucaoPagamentosChart } from "@/components/dashboard/EvolucaoPagamentosChart";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { resumo, negociacoesPorMes, recuperacaoReceita, clientesPorStatus, evolucaoPagamentos, loading } =
    useDashboard();
  const { profile } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile?.nome?.split(" ")[0] ?? ""}`}
        description="Acompanhe o desempenho das negociações em campo em tempo real."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Clientes acompanhados"
          value={String(resumo?.clientes_total ?? 0)}
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Negociações ativas"
          value={String(resumo?.negociacoes_ativas ?? 0)}
          icon={Handshake}
          tone="default"
          loading={loading}
        />
        <StatCard
          title="Valor negociado"
          value={formatCurrency(resumo?.valor_negociado_total ?? 0)}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          title="Valor recuperado"
          value={formatCurrency(resumo?.valor_recuperado_total ?? 0)}
          icon={TrendingUp}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Comprovantes pendentes"
          value={String(resumo?.comprovantes_pendentes ?? 0)}
          icon={FileWarning}
          tone="warning"
          loading={loading}
        />
        <StatCard
          title="Negociações vencidas"
          value={String(resumo?.negociacoes_vencidas ?? 0)}
          icon={AlertTriangle}
          tone="danger"
          loading={loading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NegociacoesPorMesChart data={negociacoesPorMes} />
        <RecuperacaoReceitaChart data={recuperacaoReceita} />
        <ClientesPorStatusChart data={clientesPorStatus} />
        <EvolucaoPagamentosChart data={evolucaoPagamentos} />
      </div>
    </div>
  );
}
