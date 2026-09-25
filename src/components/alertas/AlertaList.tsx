import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertaStatusBadge } from "@/components/shared/StatusBadge";
import { WhatsappButton } from "@/components/whatsapp/WhatsappButton";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AlertaComRelacoes, AlertaStatus } from "@/types";

interface AlertaListProps {
  alertas: AlertaComRelacoes[];
  loading: boolean;
  onMarcarStatus: (id: string, status: AlertaStatus) => void;
}

export function AlertaList({ alertas, loading, onMarcarStatus }: AlertaListProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Nenhum alerta encontrado"
        description="Os alertas de vencimento são gerados automaticamente 1 dia antes e no dia do vencimento das negociações."
      />
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((alerta) => {
        const dias = daysUntil(alerta.data_alerta);
        const vencido = dias !== null && dias < 0;

        return (
          <div key={alerta.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => alerta.cliente && navigate(`/clientes/${alerta.cliente.id}`)}
                  className="text-left"
                >
                  <p className="truncate font-semibold text-primary hover:underline">{alerta.cliente?.nome}</p>
                </button>
                <p className="text-xs text-muted-foreground">
                  Matrícula {alerta.cliente?.matricula} · Vencimento{" "}
                  <span className={cn(vencido && "font-semibold text-destructive")}>
                    {formatDate(alerta.negociacao?.data_vencimento)}
                  </span>
                </p>
                {alerta.negociacao?.valor_negociado != null && (
                  <p className="mt-1 text-sm font-medium">{formatCurrency(alerta.negociacao.valor_negociado)}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AlertaStatusBadge status={alerta.status} />

                {alerta.cliente?.telefone && alerta.negociacao && (
                  <WhatsappButton
                    nome={alerta.cliente.nome}
                    matricula={alerta.cliente.matricula}
                    telefone={alerta.cliente.telefone}
                    dataVencimento={alerta.negociacao.data_vencimento}
                    onSent={() => alerta.status === "Pendente" && onMarcarStatus(alerta.id, "Enviado")}
                  />
                )}

                {alerta.status !== "Resolvido" && (
                  <Button type="button" size="sm" variant="outline" onClick={() => onMarcarStatus(alerta.id, "Resolvido")}>
                    <CheckCheck className="h-4 w-4" />
                    Resolver
                  </Button>
                )}

                {alerta.status === "Pendente" && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => onMarcarStatus(alerta.id, "Enviado")}>
                    <Check className="h-4 w-4" />
                    Marcar como enviado
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
