import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ClienteFilters } from "@/components/clientes/ClienteFilters";
import { ClienteTable } from "@/components/clientes/ClienteTable";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useClientes } from "@/hooks/useClientes";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import type { Cliente } from "@/types";
import type { ClienteFormValues } from "@/lib/validations";

export default function ClientesPage() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const buscaDebounced = useDebounce(busca, 300);

  const filtros = useMemo(
    () => ({ busca: buscaDebounced || undefined, status: status || undefined }),
    [buscaDebounced, status],
  );

  const { clientes, loading, criar, atualizar, excluir } = useClientes(filtros);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteExcluindo, setClienteExcluindo] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const abrirNovo = () => {
    setClienteEditando(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setDialogAberto(true);
  };

  const handleSubmit = async (values: ClienteFormValues) => {
    setSalvando(true);
    try {
      if (clienteEditando) {
        await atualizar(clienteEditando.id, values);
        toast.success("Cliente atualizado com sucesso.");
      } else {
        await criar({ ...values, operador_id: user?.id, created_by: user?.id });
        toast.success("Cliente cadastrado com sucesso.");
      }
      setDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!clienteExcluindo) return;
    setExcluindo(true);
    try {
      await excluir(clienteExcluindo.id);
      toast.success("Cliente excluído com sucesso.");
      setClienteExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes acompanhados pela sua equipe em campo."
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        }
      />

      <ClienteFilters busca={busca} onBuscaChange={setBusca} status={status} onStatusChange={setStatus} />

      <ClienteTable
        clientes={clientes}
        loading={loading}
        onEdit={abrirEdicao}
        onDelete={setClienteExcluindo}
      />

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{clienteEditando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={clienteEditando}
            onSubmit={handleSubmit}
            onCancel={() => setDialogAberto(false)}
            submitting={salvando}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!clienteExcluindo}
        onOpenChange={(open) => !open && setClienteExcluindo(null)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${clienteExcluindo?.nome}"? Esta ação também removerá negociações, comprovantes e interações vinculadas. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={excluindo}
        onConfirm={handleExcluir}
      />
    </div>
  );
}
