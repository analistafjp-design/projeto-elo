import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertaList } from "@/components/alertas/AlertaList";
import { useAlertas } from "@/hooks/useAlertas";
import * as alertasService from "@/services/alertasService";
import type { AlertaStatus } from "@/types";

const ABAS: { label: string; value: AlertaStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendentes", value: "Pendente" },
  { label: "Enviados", value: "Enviado" },
  { label: "Resolvidos", value: "Resolvido" },
];

export default function AlertasPage() {
  const [aba, setAba] = useState<AlertaStatus | "todos">("Pendente");
  const { alertas, loading, recarregar, marcarStatus } = useAlertas(aba === "todos" ? undefined : aba);
  const [gerando, setGerando] = useState(false);

  const handleGerarAlertas = async () => {
    setGerando(true);
    try {
      await alertasService.gerarAlertasManualmente();
      toast.success("Rotina de alertas executada com sucesso.");
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar alertas.");
    } finally {
      setGerando(false);
    }
  };

  const handleMarcarStatus = async (id: string, status: AlertaStatus) => {
    try {
      await marcarStatus(id, status);
      toast.success(`Alerta marcado como "${status}".`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar alerta.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Central de notificações"
        description="Alertas automáticos de vencimento: 1 dia antes, no dia e negociações vencidas."
        actions={
          <Button type="button" variant="outline" onClick={handleGerarAlertas} disabled={gerando}>
            <RefreshCw className={gerando ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Atualizar alertas agora
          </Button>
        }
      />

      <Tabs value={aba} onValueChange={(v) => setAba(v as AlertaStatus | "todos")} className="mb-4">
        <TabsList>
          {ABAS.map((a) => (
            <TabsTrigger key={a.value} value={a.value}>
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AlertaList alertas={alertas} loading={loading} onMarcarStatus={handleMarcarStatus} />
    </div>
  );
}
