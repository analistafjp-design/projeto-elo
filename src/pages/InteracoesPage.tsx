import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Phone, MessageCircle, MapPin, Handshake, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import * as interacoesService from "@/services/interacoesService";
import type { Interacao } from "@/types";

type InteracaoComCliente = Interacao & { cliente?: { id: string; nome: string; matricula: string } | null };

const ICONES: Record<string, LucideIcon> = {
  Ligação: Phone,
  WhatsApp: MessageCircle,
  Visita: MapPin,
  Negociação: Handshake,
};

export default function InteracoesPage() {
  const navigate = useNavigate();
  const [interacoes, setInteracoes] = useState<InteracaoComCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interacoesService
      .listarInteracoesRecentes(60)
      .then(setInteracoes)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar interações."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Interações"
        description="Histórico recente de ligações, mensagens, visitas e negociações registradas em campo."
      />

      {loading ? (
        <div className="max-w-2xl space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : interacoes.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhuma interação registrada ainda"
          description="Acesse o perfil de um cliente para registrar a primeira interação."
        />
      ) : (
        <ol className="relative max-w-2xl space-y-5 border-l border-border pl-6">
          {interacoes.map((interacao) => {
            const Icone = ICONES[interacao.tipo] ?? Phone;
            const temLocalizacao = interacao.latitude != null && interacao.longitude != null;

            return (
              <li key={interacao.id} className="relative">
                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-elo-blue-lighter text-primary ring-4 ring-white">
                  <Icone className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-lg border border-border bg-white p-3">
                  <button
                    type="button"
                    onClick={() => interacao.cliente && navigate(`/clientes/${interacao.cliente.id}`)}
                    className="text-left"
                  >
                    <p className="text-sm font-semibold text-primary hover:underline">
                      {interacao.cliente?.nome ?? "Cliente removido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {interacao.cliente?.matricula} · {interacao.tipo} · {formatDateTime(interacao.created_at)}
                    </p>
                  </button>

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
      )}
    </div>
  );
}
