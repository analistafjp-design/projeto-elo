import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin as MapPinIcon,
  CreditCard,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClienteStatusBadge } from "@/components/shared/StatusBadge";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { NegociacaoTable } from "@/components/negociacoes/NegociacaoTable";
import { NegociacaoForm } from "@/components/negociacoes/NegociacaoForm";
import { NovaNegociacaoOcrDialog } from "@/components/negociacoes/NovaNegociacaoOcrDialog";
import { ComprovanteUpload } from "@/components/comprovantes/ComprovanteUpload";
import { ComprovanteList } from "@/components/comprovantes/ComprovanteList";
import { InteracaoForm } from "@/components/interacoes/InteracaoForm";
import { InteracaoTimeline } from "@/components/interacoes/InteracaoTimeline";
import { AlertaList } from "@/components/alertas/AlertaList";
import { WhatsappButton } from "@/components/whatsapp/WhatsappButton";
import { EmptyState } from "@/components/shared/EmptyState";

import { useAuth } from "@/context/AuthContext";
import { useNegociacoesPorCliente } from "@/hooks/useNegociacoes";
import { useComprovantesPorCliente } from "@/hooks/useComprovantes";
import { useInteracoesPorCliente } from "@/hooks/useInteracoes";
import * as clientesService from "@/services/clientesService";
import * as alertasService from "@/services/alertasService";
import * as interacoesService from "@/services/interacoesService";
import { useEffect } from "react";
import type { Cliente, AlertaComRelacoes, AlertaStatus } from "@/types";
import type { ClienteFormValues, NegociacaoFormValues } from "@/lib/validations";

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [editando, setEditando] = useState(false);
  const [excluindoCliente, setExcluindoCliente] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const carregarCliente = async () => {
    if (!id) return;
    setLoadingCliente(true);
    try {
      const dados = await clientesService.buscarCliente(id);
      setCliente(dados);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar cliente.");
    } finally {
      setLoadingCliente(false);
    }
  };

  useEffect(() => {
    carregarCliente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const negociacoesHook = useNegociacoesPorCliente(id);
  const comprovantesHook = useComprovantesPorCliente(id);
  const interacoesHook = useInteracoesPorCliente(id);

  const [alertas, setAlertas] = useState<AlertaComRelacoes[]>([]);
  const [loadingAlertas, setLoadingAlertas] = useState(true);
  useEffect(() => {
    if (!id) return;
    setLoadingAlertas(true);
    alertasService
      .listarAlertasPorCliente(id)
      .then(setAlertas)
      .catch(() => setAlertas([]))
      .finally(() => setLoadingAlertas(false));
  }, [id]);

  const [negociacaoDialogAberto, setNegociacaoDialogAberto] = useState(false);
  const [negociacaoEditando, setNegociacaoEditando] = useState<null | { id: string }>(null);
  const [negociacaoExcluindo, setNegociacaoExcluindo] = useState<null | { id: string }>(null);
  const [salvandoNegociacao, setSalvandoNegociacao] = useState(false);
  const [excluindoNegociacao, setExcluindoNegociacao] = useState(false);

  const [interacaoDialogAberto, setInteracaoDialogAberto] = useState(false);
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);

  if (loadingCliente) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <EmptyState
        icon={MapPinIcon}
        title="Cliente não encontrado"
        description="O cliente que você tentou acessar não existe ou foi removido."
        action={<Button onClick={() => navigate("/clientes")}>Voltar para clientes</Button>}
      />
    );
  }

  const handleAtualizarCliente = async (values: ClienteFormValues) => {
    setSalvandoCliente(true);
    try {
      await clientesService.atualizarCliente(cliente.id, values);
      toast.success("Cliente atualizado com sucesso.");
      setEditando(false);
      carregarCliente();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar cliente.");
    } finally {
      setSalvandoCliente(false);
    }
  };

  const handleExcluirCliente = async () => {
    try {
      await clientesService.excluirCliente(cliente.id);
      toast.success("Cliente excluído.");
      navigate("/clientes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir cliente.");
    }
  };

  const handleSalvarNegociacao = async (values: NegociacaoFormValues) => {
    setSalvandoNegociacao(true);
    try {
      if (negociacaoEditando) {
        await negociacoesHook.atualizar(negociacaoEditando.id, values);
        toast.success("Negociação atualizada.");
      } else {
        await negociacoesHook.criar({ ...values, cliente_id: cliente.id, created_by: user?.id });
        toast.success("Negociação registrada.");
      }
      setNegociacaoDialogAberto(false);
      setNegociacaoEditando(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar negociação.");
    } finally {
      setSalvandoNegociacao(false);
    }
  };

  const handleExcluirNegociacao = async () => {
    if (!negociacaoExcluindo) return;
    setExcluindoNegociacao(true);
    try {
      await negociacoesHook.excluir(negociacaoExcluindo.id);
      toast.success("Negociação excluída.");
      setNegociacaoExcluindo(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir negociação.");
    } finally {
      setExcluindoNegociacao(false);
    }
  };

  const handleMarcarStatusAlerta = async (alertaId: string, status: AlertaStatus) => {
    try {
      await alertasService.atualizarStatusAlerta(alertaId, status);
      setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, status } : a)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar alerta.");
    }
  };

  const handleRegistrarInteracao = async (values: {
    tipo: string;
    descricao?: string;
    foto?: File | null;
    coordenadas?: { latitude: number; longitude: number } | null;
  }) => {
    setSalvandoInteracao(true);
    try {
      let foto_url: string | null = null;
      if (values.foto) {
        foto_url = await interacoesService.uploadFotoVisita(cliente.id, values.foto);
      }
      await interacoesHook.registrar({
        cliente_id: cliente.id,
        tipo: values.tipo as never,
        descricao: values.descricao || null,
        latitude: values.coordenadas?.latitude ?? null,
        longitude: values.coordenadas?.longitude ?? null,
        foto_url,
        created_by: user?.id,
      });
      toast.success("Interação registrada.");
      setInteracaoDialogAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar interação.");
    } finally {
      setSalvandoInteracao(false);
    }
  };

  const ultimaLocalizacao = interacoesHook.interacoes.find(
    (i) => i.latitude != null && i.longitude != null,
  );

  const negociacaoEditandoCompleta = negociacaoEditando
    ? negociacoesHook.negociacoes.find((n) => n.id === negociacaoEditando.id)
    : null;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/clientes")}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-elo-blue-dark">{cliente.nome}</h1>
              <ClienteStatusBadge status={cliente.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Matrícula: {cliente.matricula}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {cliente.telefone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {cliente.telefone}
                </span>
              )}
              {cliente.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {cliente.email}
                </span>
              )}
              {cliente.cpf && (
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> {cliente.cpf}
                </span>
              )}
              {cliente.endereco && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" /> {cliente.endereco}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {cliente.telefone && negociacoesHook.negociacoes[0] && (
              <WhatsappButton
                nome={cliente.nome}
                matricula={cliente.matricula}
                telefone={cliente.telefone}
                dataVencimento={negociacoesHook.negociacoes[0].data_vencimento}
              />
            )}
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setExcluindoCliente(true)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="negociacoes">
        <TabsList>
          <TabsTrigger value="negociacoes">Negociações</TabsTrigger>
          <TabsTrigger value="comprovantes">Comprovantes</TabsTrigger>
          <TabsTrigger value="interacoes">Interações</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="negociacoes">
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <NovaNegociacaoOcrDialog
              criarNegociacao={async (values) =>
                negociacoesHook.criar({ ...values, cliente_id: cliente.id, created_by: user?.id })
              }
              enviarComprovante={(params) => comprovantesHook.enviar({ ...params, criadoPor: user?.id })}
            />
            <Button
              onClick={() => {
                setNegociacaoEditando(null);
                setNegociacaoDialogAberto(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nova negociação
            </Button>
          </div>
          <NegociacaoTable
            negociacoes={negociacoesHook.negociacoes}
            loading={negociacoesHook.loading}
            onEdit={(n) => {
              setNegociacaoEditando({ id: n.id });
              setNegociacaoDialogAberto(true);
            }}
            onDelete={(n) => setNegociacaoExcluindo({ id: n.id })}
          />
        </TabsContent>

        <TabsContent value="comprovantes">
          <div className="mb-4 flex justify-end">
            <ComprovanteUpload
              enviar={(params) => comprovantesHook.enviar({ ...params, criadoPor: user?.id })}
            />
          </div>
          <ComprovanteList
            comprovantes={comprovantesHook.comprovantes}
            loading={comprovantesHook.loading}
            onExcluir={comprovantesHook.excluir}
          />
        </TabsContent>

        <TabsContent value="interacoes">
          <div className="mb-4 flex justify-end">
            <Dialog open={interacaoDialogAberto} onOpenChange={setInteracaoDialogAberto}>
              <Button onClick={() => setInteracaoDialogAberto(true)}>
                <Plus className="h-4 w-4" /> Nova interação
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova interação</DialogTitle>
                </DialogHeader>
                <InteracaoForm
                  onSubmit={handleRegistrarInteracao}
                  onCancel={() => setInteracaoDialogAberto(false)}
                  submitting={salvandoInteracao}
                />
              </DialogContent>
            </Dialog>
          </div>
          <InteracaoTimeline
            interacoes={interacoesHook.interacoes}
            loading={interacoesHook.loading}
            onExcluir={interacoesHook.excluir}
          />
        </TabsContent>

        <TabsContent value="alertas">
          <AlertaList alertas={alertas} loading={loadingAlertas} onMarcarStatus={handleMarcarStatusAlerta} />
        </TabsContent>

        <TabsContent value="mapa">
          {ultimaLocalizacao ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe
                title="Localização da última visita"
                width="100%"
                height="420"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${ultimaLocalizacao.latitude},${ultimaLocalizacao.longitude}&z=15&output=embed`}
              />
            </div>
          ) : (
            <EmptyState
              icon={MapPinIcon}
              title="Nenhuma localização registrada"
              description="Registre uma visita para este cliente para visualizar o mapa com a localização capturada."
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            cliente={cliente}
            onSubmit={handleAtualizarCliente}
            onCancel={() => setEditando(false)}
            submitting={salvandoCliente}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={negociacaoDialogAberto}
        onOpenChange={(open) => {
          setNegociacaoDialogAberto(open);
          if (!open) setNegociacaoEditando(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{negociacaoEditando ? "Editar negociação" : "Nova negociação"}</DialogTitle>
          </DialogHeader>
          <NegociacaoForm
            negociacao={negociacaoEditandoCompleta}
            onSubmit={handleSalvarNegociacao}
            onCancel={() => setNegociacaoDialogAberto(false)}
            submitting={salvandoNegociacao}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={excluindoCliente}
        onOpenChange={setExcluindoCliente}
        title="Excluir cliente"
        description="Tem certeza que deseja excluir este cliente? Todos os dados vinculados (negociações, comprovantes, interações e alertas) também serão removidos. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onConfirm={handleExcluirCliente}
      />

      <ConfirmDialog
        open={!!negociacaoExcluindo}
        onOpenChange={(open) => !open && setNegociacaoExcluindo(null)}
        title="Excluir negociação"
        description="Tem certeza que deseja excluir esta negociação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        loading={excluindoNegociacao}
        onConfirm={handleExcluirNegociacao}
      />
    </div>
  );
}
