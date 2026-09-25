import { useState } from "react";
import { toast } from "sonner";
import { Download, Eye, FileText, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDateTime } from "@/lib/utils";
import * as comprovantesService from "@/services/comprovantesService";
import type { Comprovante } from "@/types";

interface ComprovanteListProps {
  comprovantes: Comprovante[];
  loading: boolean;
  onExcluir: (comprovante: Comprovante) => Promise<void>;
}

export function ComprovanteList({ comprovantes, loading, onExcluir }: ComprovanteListProps) {
  const [excluindo, setExcluindo] = useState<Comprovante | null>(null);
  const [processando, setProcessando] = useState(false);
  const [abrindo, setAbrindo] = useState<string | null>(null);

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

  const handleExcluir = async () => {
    if (!excluindo) return;
    setProcessando(true);
    try {
      await onExcluir(excluindo);
      toast.success("Arquivo excluído.");
      setExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir arquivo.");
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (comprovantes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum arquivo enviado"
        description="Envie contas e comprovantes de pagamento para manter o histórico completo."
      />
    );
  }

  const ehImagem = (path: string) => /\.(jpe?g|png)$/i.test(path);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {comprovantes.map((comprovante) => (
          <div
            key={comprovante.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-white"
          >
            <div className="flex h-28 items-center justify-center bg-muted">
              {ehImagem(comprovante.arquivo_path) ? (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="p-2.5">
              <Badge variant="outline" className="mb-1 text-[10px]">
                {comprovante.tipo}
              </Badge>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateTime(comprovante.created_at)}
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => abrirArquivo(comprovante, "visualizar")}
                disabled={abrindo === comprovante.id}
                aria-label="Visualizar"
              >
                {abrindo === comprovante.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => abrirArquivo(comprovante, "baixar")}
                aria-label="Baixar"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={() => setExcluindo(comprovante)}
                aria-label="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!excluindo}
        onOpenChange={(open) => !open && setExcluindo(null)}
        title="Excluir arquivo"
        description="Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={processando}
        onConfirm={handleExcluir}
      />
    </>
  );
}
