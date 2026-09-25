import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Download, Eye, FileText, ImageIcon, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import * as comprovantesService from "@/services/comprovantesService";
import type { Comprovante } from "@/types";

type ComprovanteComCliente = Comprovante & {
  cliente?: { id: string; nome: string; matricula: string } | null;
};

export default function ComprovantesPage() {
  const navigate = useNavigate();
  const [comprovantes, setComprovantes] = useState<ComprovanteComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [abrindo, setAbrindo] = useState<string | null>(null);

  useEffect(() => {
    comprovantesService
      .listarComprovantesRecentes(60)
      .then(setComprovantes)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Erro ao carregar arquivos."))
      .finally(() => setLoading(false));
  }, []);

  const abrirArquivo = async (comprovante: Comprovante, modo: "visualizar" | "baixar") => {
    setAbrindo(comprovante.id);
    try {
      const url = await comprovantesService.obterUrlAssinada(comprovante.arquivo_path);
      if (modo === "baixar") {
        const link = document.createElement("a");
        link.href = url;
        link.download = comprovante.arquivo_path.split("/").pop() ?? "arquivo";
        link.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir arquivo.");
    } finally {
      setAbrindo(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Comprovantes"
        description="Últimos arquivos de contas e comprovantes de pagamento enviados pela equipe."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : comprovantes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum arquivo enviado ainda"
          description="Acesse o perfil de um cliente para enviar contas e comprovantes."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {comprovantes.map((comprovante) => (
            <div key={comprovante.id} className="overflow-hidden rounded-lg border border-border bg-white">
              <button
                type="button"
                onClick={() => comprovante.cliente && navigate(`/clientes/${comprovante.cliente.id}`)}
                className="flex h-24 w-full items-center justify-center bg-muted"
              >
                {/\.(jpe?g|png)$/i.test(comprovante.arquivo_path) ? (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                ) : (
                  <FileText className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
              <div className="p-2.5">
                <Badge variant="outline" className="mb-1 text-[10px]">
                  {comprovante.tipo}
                </Badge>
                <p className="truncate text-xs font-medium">{comprovante.cliente?.nome ?? "-"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {formatDateTime(comprovante.created_at)}
                </p>
                <div className="mt-2 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => abrirArquivo(comprovante, "visualizar")}
                    disabled={abrindo === comprovante.id}
                  >
                    {abrindo === comprovante.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => abrirArquivo(comprovante, "baixar")}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
