import { Phone, MessageCircle, MapPin, Handshake, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/utils";
import type { Interacao } from "@/types";
import type { LucideIcon } from "lucide-react";

const ICONES: Record<string, LucideIcon> = {
  Ligação: Phone,
  WhatsApp: MessageCircle,
  Visita: MapPin,
  Negociação: Handshake,
};

interface InteracaoTimelineProps {
  interacoes: Interacao[];
  loading: boolean;
  onExcluir?: (id: string) => void;
}

export function InteracaoTimeline({ interacoes, loading, onExcluir }: InteracaoTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (interacoes.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Nenhuma interação registrada"
        description="Registre ligações, mensagens, visitas ou negociações realizadas com este cliente."
      />
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {interacoes.map((interacao) => {
        const Icone = ICONES[interacao.tipo] ?? Phone;
        const temLocalizacao = interacao.latitude != null && interacao.longitude != null;

        return (
          <li key={interacao.id} className="relative">
            <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-elo-blue-lighter text-primary ring-4 ring-white">
              <Icone className="h-3.5 w-3.5" />
            </span>

            <div className="rounded-lg border border-border bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{interacao.tipo}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(interacao.created_at)}</p>
                </div>
                {onExcluir && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onExcluir(interacao.id)}
                    aria-label="Excluir interação"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {interacao.descricao && <p className="mt-1.5 text-sm">{interacao.descricao}</p>}

              {interacao.foto_url && (
                <img
                  src={interacao.foto_url}
                  alt="Foto da visita"
                  className="mt-2 max-h-40 max-w-full rounded-md border border-border object-contain"
                />
              )}

              {temLocalizacao && (
                <a
                  href={`https://www.google.com/maps?q=${interacao.latitude},${interacao.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" />
                  Ver localização no mapa
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
