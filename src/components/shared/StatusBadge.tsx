import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NEGOCIACAO_STATUS_COLORS, type NegociacaoStatus } from "@/lib/constants";

export function NegociacaoStatusBadge({ status }: { status: NegociacaoStatus | string }) {
  const cor = NEGOCIACAO_STATUS_COLORS[status as NegociacaoStatus] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cor)}>
      {status}
    </Badge>
  );
}

const CLIENTE_STATUS_COLORS: Record<string, string> = {
  Ativo: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Inativo: "bg-slate-100 text-slate-700 border-slate-300",
  "Em Negociação": "bg-blue-100 text-blue-800 border-blue-300",
};

export function ClienteStatusBadge({ status }: { status: string }) {
  const cor = CLIENTE_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cor)}>
      {status}
    </Badge>
  );
}

const ALERTA_STATUS_COLORS: Record<string, string> = {
  Pendente: "bg-amber-100 text-amber-800 border-amber-300",
  Enviado: "bg-blue-100 text-blue-800 border-blue-300",
  Resolvido: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function AlertaStatusBadge({ status }: { status: string }) {
  const cor = ALERTA_STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", cor)}>
      {status}
    </Badge>
  );
}
