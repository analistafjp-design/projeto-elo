import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { NegociacaoTable } from "@/components/negociacoes/NegociacaoTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as negociacoesService from "@/services/negociacoesService";
import { abrirWhatsapp } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";
import { NEGOCIACAO_STATUS } from "@/lib/constants";
import type { Negociacao, NegociacaoComCliente } from "@/types";

export default function NegociacoesPage() {
  const [status, setStatus] = useState("");
  const [negociacoes, setNegociacoes] = useState<NegociacaoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [excluindo, setExcluindo] = useState<Negociacao | null>(null);
  const [processando, setProcessando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      const dados = await negociacoesService.listarTodasNegociacoes(status || undefined);
      setNegociacoes(dados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar negociações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleExcluir = async () => {
    if (!excluindo) return;
    setProcessando(true);
    try {
      await negociacoesService.excluirNegociacao(excluindo.id);
      toast.success("Negociação excluída.");
      setExcluindo(null);
      carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir negociação.");
    } finally {
      setProcessando(false);
    }
  };

  const handleLembrete = (negociacao: NegociacaoComCliente) => {
    if (!negociacao.cliente) return;
    abrirWhatsapp({
      telefone: "",
      nome: negociacao.cliente.nome,
      matricula: negociacao.cliente.matricula,
      dataVencimento: formatDate(negociacao.data_vencimento),
    });
  };

  return (
    <div>
      <PageHeader
        title="Negociações"
        description="Visão consolidada de todas as negociações em andamento."
        actions={
          <Select value={status || "todos"} onValueChange={(v) => setStatus(v === "todos" ? "" : v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {NEGOCIACAO_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <NegociacaoTable
        negociacoes={negociacoes}
        loading={loading}
        mostrarCliente
        onEdit={() => toast.info("Abra o cliente para editar esta negociação.")}
        onDelete={setExcluindo}
        onLembrete={handleLembrete}
      />

      <ConfirmDialog
        open={!!excluindo}
        onOpenChange={(open) => !open && setExcluindo(null)}
        title="Excluir negociação"
        description="Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={processando}
        onConfirm={handleExcluir}
      />
    </div>
  );
}
