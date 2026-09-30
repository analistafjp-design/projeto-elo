import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as clientesService from "@/services/clientesService";
import type { ClienteImportadoLinha, ErroImportacaoLinha } from "@/lib/excel";
import type { Cliente } from "@/types";

interface ClienteImportDialogProps {
  clientes: Cliente[];
  userId?: string;
  onImportado: () => void;
}

type Etapa = "selecionar" | "revisao" | "processando" | "concluido";

interface LinhaResultado extends ClienteImportadoLinha {
  resultado: "criado" | "atualizado" | "erro";
  motivoErro?: string;
}

/**
 * Fluxo: escolher a planilha -> revisar linhas válidas/erros de
 * formato -> confirmar -> criar (matrícula nova) ou atualizar
 * (matrícula já existente) cada cliente -> resumo final.
 */
export function ClienteImportDialog({ clientes, userId, onImportado }: ClienteImportDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("selecionar");
  const [validos, setValidos] = useState<ClienteImportadoLinha[]>([]);
  const [errosParse, setErrosParse] = useState<ErroImportacaoLinha[]>([]);
  const [resultados, setResultados] = useState<LinhaResultado[]>([]);
  const [progresso, setProgresso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetar = () => {
    setEtapa("selecionar");
    setValidos([]);
    setErrosParse([]);
    setResultados([]);
    setProgresso(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleArquivoSelecionado = async (file: File | null) => {
    if (!file) return;
    try {
      const { parseClientesExcel } = await import("@/lib/excel");
      const { validos: linhasValidas, erros } = await parseClientesExcel(file);
      setValidos(linhasValidas);
      setErrosParse(erros);
      setEtapa("revisao");
      if (linhasValidas.length === 0) {
        toast.error("Nenhuma linha válida encontrada na planilha.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ler a planilha.");
    }
  };

  const confirmarImportacao = async () => {
    setEtapa("processando");
    setProgresso(0);

    const mapaPorMatricula = new Map(clientes.map((c) => [c.matricula.trim().toLowerCase(), c]));
    const resultadosParciais: LinhaResultado[] = [];

    for (let i = 0; i < validos.length; i++) {
      const linha = validos[i];
      const chave = linha.matricula.trim().toLowerCase();
      const existente = mapaPorMatricula.get(chave);

      try {
        if (existente) {
          await clientesService.atualizarCliente(existente.id, {
            nome: linha.nome,
            telefone: linha.telefone ?? null,
            endereco: linha.endereco ?? null,
            status: linha.status,
          });
          resultadosParciais.push({ ...linha, resultado: "atualizado" });
        } else {
          const novo = await clientesService.criarCliente({
            matricula: linha.matricula,
            nome: linha.nome,
            telefone: linha.telefone ?? null,
            endereco: linha.endereco ?? null,
            status: linha.status,
            operador_id: userId ?? null,
            created_by: userId ?? null,
          });
          mapaPorMatricula.set(chave, novo);
          resultadosParciais.push({ ...linha, resultado: "criado" });
        }
      } catch (err) {
        resultadosParciais.push({
          ...linha,
          resultado: "erro",
          motivoErro: err instanceof Error ? err.message : "Erro desconhecido.",
        });
      }

      setProgresso(Math.round(((i + 1) / validos.length) * 100));
    }

    setResultados(resultadosParciais);
    setEtapa("concluido");
    onImportado();
  };

  const fechar = () => {
    setAberto(false);
    resetar();
  };

  const criados = resultados.filter((r) => r.resultado === "criado").length;
  const atualizados = resultados.filter((r) => r.resultado === "atualizado").length;
  const comErro = resultados.filter((r) => r.resultado === "erro").length;

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        setAberto(open);
        if (!open) resetar();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar clientes de uma planilha</DialogTitle>
        </DialogHeader>

        {etapa === "selecionar" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie um arquivo Excel (.xlsx ou .xls) com as colunas <strong>Matrícula</strong>,{" "}
              <strong>Nome</strong>, Telefone, Endereço e Status. Clientes com matrícula já
              cadastrada serão atualizados; os demais serão criados.
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-accent">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => handleArquivoSelecionado(e.target.files?.[0] ?? null)}
              />
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Clique para escolher o arquivo</span>
            </label>
          </div>
        )}

        {etapa === "revisao" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {validos.length} linha(s) válida(s)
              </span>
              {errosParse.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-destructive">
                  <XCircle className="h-4 w-4 shrink-0" />
                  {errosParse.length} linha(s) com erro
                </span>
              )}
            </div>

            {errosParse.length > 0 && (
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                {errosParse.map((e, i) => (
                  <p key={i}>
                    Linha {e.linha}: {e.motivo}
                  </p>
                ))}
              </div>
            )}

            {validos.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validos.map((l) => (
                      <TableRow key={l.linha}>
                        <TableCell className="font-medium">{l.matricula}</TableCell>
                        <TableCell>{l.nome}</TableCell>
                        <TableCell>{l.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetar}>
                Escolher outro arquivo
              </Button>
              <Button type="button" onClick={confirmarImportacao} disabled={validos.length === 0}>
                Importar {validos.length} cliente(s)
              </Button>
            </DialogFooter>
          </div>
        )}

        {etapa === "processando" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando clientes... {progresso}%</p>
          </div>
        )}

        {etapa === "concluido" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-emerald-700">{criados} criado(s)</span>
              <span className="text-blue-700">{atualizados} atualizado(s)</span>
              {comErro > 0 && <span className="text-destructive">{comErro} com erro</span>}
            </div>

            {comErro > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                {resultados
                  .filter((r) => r.resultado === "erro")
                  .map((r) => (
                    <p key={r.linha}>
                      Linha {r.linha} ({r.matricula}): {r.motivoErro}
                    </p>
                  ))}
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={fechar}>
                Concluir
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
