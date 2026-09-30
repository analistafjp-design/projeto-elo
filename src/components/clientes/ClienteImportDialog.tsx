import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, Layers } from "lucide-react";

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
import type { Cliente, ClienteInsert } from "@/types";

interface ClienteImportDialogProps {
  clientes: Cliente[];
  userId?: string;
  onImportado: () => void;
}

type Etapa = "selecionar" | "escolher-aba" | "revisao" | "processando" | "concluido";

interface LinhaResultado extends ClienteImportadoLinha {
  resultado: "criado" | "atualizado" | "erro";
  motivoErro?: string;
}

const TAMANHO_LOTE = 500;
const MAX_PREVIEW = 50;

function dividirEmLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

/**
 * Fluxo: escolher a planilha -> (se tiver mais de uma aba, escolher qual
 * usar) -> revisar linhas válidas/erros de formato -> confirmar -> criar
 * (matrícula nova) ou atualizar (matrícula já existente, preservando o
 * operador responsável já atribuído) -> resumo final.
 *
 * A leitura roda em um Web Worker (ver lib/excel.ts) e a gravação é feita
 * em lotes (não uma requisição por linha), para lidar bem com planilhas
 * reais grandes (relatórios com dezenas de milhares de linhas), não só
 * com listas pequenas.
 */
export function ClienteImportDialog({ clientes, userId, onImportado }: ClienteImportDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>("selecionar");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [abas, setAbas] = useState<string[]>([]);
  const [carregandoAbas, setCarregandoAbas] = useState(false);
  const [carregandoAba, setCarregandoAba] = useState(false);
  const [validos, setValidos] = useState<ClienteImportadoLinha[]>([]);
  const [errosParse, setErrosParse] = useState<ErroImportacaoLinha[]>([]);
  const [resultados, setResultados] = useState<LinhaResultado[]>([]);
  const [progresso, setProgresso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetar = () => {
    setEtapa("selecionar");
    setArquivo(null);
    setAbas([]);
    setValidos([]);
    setErrosParse([]);
    setResultados([]);
    setProgresso(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const carregarAba = async (file: File, nomeAba: string) => {
    setCarregandoAba(true);
    try {
      const { parseAbaExcel } = await import("@/lib/excel");
      const { validos: linhasValidas, erros, erroGeral } = await parseAbaExcel(file, nomeAba);
      if (erroGeral) {
        toast.error(erroGeral);
        setEtapa(abas.length > 1 ? "escolher-aba" : "selecionar");
        return;
      }
      setValidos(linhasValidas);
      setErrosParse(erros);
      setEtapa("revisao");
      if (linhasValidas.length === 0) {
        toast.error("Nenhuma linha válida encontrada nessa aba.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ler a planilha.");
      setEtapa(abas.length > 1 ? "escolher-aba" : "selecionar");
    } finally {
      setCarregandoAba(false);
    }
  };

  const handleArquivoSelecionado = async (file: File | null) => {
    if (!file) return;
    setArquivo(file);
    setCarregandoAbas(true);
    try {
      const { listarAbasExcel } = await import("@/lib/excel");
      const nomesAbas = await listarAbasExcel(file);
      setAbas(nomesAbas);
      if (nomesAbas.length <= 1) {
        await carregarAba(file, nomesAbas[0]);
      } else {
        setEtapa("escolher-aba");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao abrir o arquivo.");
    } finally {
      setCarregandoAbas(false);
    }
  };

  const confirmarImportacao = async () => {
    setEtapa("processando");
    setProgresso(0);

    const mapaLocal = new Map(clientes.map((c) => [c.matricula.trim().toLowerCase(), c]));
    const matriculasDesconhecidas = Array.from(
      new Set(
        validos
          .map((l) => l.matricula.trim().toLowerCase())
          .filter((m) => !mapaLocal.has(m)),
      ),
    );

    // A lista de clientes já carregada na tela pode estar desatualizada
    // ou incompleta (filtros aplicados), então confirmamos no banco quais
    // matrículas "desconhecidas" já existem de fato antes de decidir
    // criar x atualizar — e, para as que já existem, preservamos o
    // operador responsável atual em vez de reatribuí-lo para quem está
    // importando.
    const lotesBusca = dividirEmLotes(matriculasDesconhecidas, TAMANHO_LOTE);
    const totalEtapas = lotesBusca.length + dividirEmLotes(validos, TAMANHO_LOTE).length;
    let etapasFeitas = 0;

    for (const lote of lotesBusca) {
      try {
        const encontrados = await clientesService.buscarClientesPorMatriculas(lote);
        for (const c of encontrados) {
          mapaLocal.set(c.matricula.trim().toLowerCase(), c as Cliente);
        }
      } catch {
        // Se a verificação falhar, seguimos sem essa informação — as
        // linhas correspondentes serão tratadas como "novas" e, se já
        // existirem de fato, o próprio banco vai rejeitar a tentativa de
        // criação (matrícula duplicada), o que ainda aparece como erro
        // claro no resumo final.
      }
      etapasFeitas += 1;
      setProgresso(Math.round((etapasFeitas / totalEtapas) * 100));
    }

    const resultadosParciais: LinhaResultado[] = [];
    const lotesGravacao = dividirEmLotes(validos, TAMANHO_LOTE);

    for (const lote of lotesGravacao) {
      const payload: (ClienteInsert & { __linha: ClienteImportadoLinha })[] = lote.map((linha) => {
        const existente = mapaLocal.get(linha.matricula.trim().toLowerCase());
        return {
          matricula: linha.matricula,
          nome: linha.nome,
          telefone: linha.telefone ?? null,
          endereco: linha.endereco ?? null,
          status: linha.status,
          operador_id: existente ? existente.operador_id : (userId ?? null),
          created_by: existente ? existente.created_by : (userId ?? null),
          __linha: linha,
        };
      });

      try {
        await clientesService.upsertClientesEmLote(payload.map(({ __linha, ...resto }) => resto));
        for (const item of payload) {
          const jaExistia = mapaLocal.has(item.__linha.matricula.trim().toLowerCase());
          resultadosParciais.push({
            ...item.__linha,
            resultado: jaExistia ? "atualizado" : "criado",
          });
        }
      } catch {
        // Um lote inteiro falhar não significa que toda linha dele está
        // errada (ex.: um timeout momentâneo) — refazemos linha a linha
        // só para esse lote, para não perder o restante do trabalho já
        // feito e ainda mostrar exatamente qual linha tem problema.
        for (const item of payload) {
          const chave = item.__linha.matricula.trim().toLowerCase();
          const existente = mapaLocal.get(chave);
          try {
            if (existente) {
              await clientesService.atualizarCliente(existente.id, {
                nome: item.nome,
                telefone: item.telefone,
                endereco: item.endereco,
                status: item.status,
              });
              resultadosParciais.push({ ...item.__linha, resultado: "atualizado" });
            } else {
              const novo = await clientesService.criarCliente({
                matricula: item.matricula,
                nome: item.nome,
                telefone: item.telefone,
                endereco: item.endereco,
                status: item.status,
                operador_id: userId ?? null,
                created_by: userId ?? null,
              });
              mapaLocal.set(chave, novo);
              resultadosParciais.push({ ...item.__linha, resultado: "criado" });
            }
          } catch (errLinha) {
            resultadosParciais.push({
              ...item.__linha,
              resultado: "erro",
              motivoErro: errLinha instanceof Error ? errLinha.message : "Erro desconhecido.",
            });
          }
        }
      }

      etapasFeitas += 1;
      setProgresso(Math.round((etapasFeitas / totalEtapas) * 100));
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
  const errosExibidos = resultados.filter((r) => r.resultado === "erro").slice(0, MAX_PREVIEW);

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
              cadastrada serão atualizados; os demais serão criados. Planilhas com várias abas ou
              muitas linhas também são aceitas.
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-accent">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                disabled={carregandoAbas}
                onChange={(e) => handleArquivoSelecionado(e.target.files?.[0] ?? null)}
              />
              {carregandoAbas ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              )}
              <span className="text-sm font-medium">
                {carregandoAbas ? "Abrindo arquivo..." : "Clique para escolher o arquivo"}
              </span>
            </label>
          </div>
        )}

        {etapa === "escolher-aba" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esse arquivo tem {abas.length} abas. Qual delas tem a lista de clientes?
            </p>
            {carregandoAba ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Lendo a aba escolhida...</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {abas.map((nome) => (
                  <Button
                    key={nome}
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => arquivo && carregarAba(arquivo, nome)}
                  >
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="truncate">{nome}</span>
                  </Button>
                ))}
              </div>
            )}
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
                {errosParse.slice(0, MAX_PREVIEW).map((e, i) => (
                  <p key={i}>
                    Linha {e.linha}: {e.motivo}
                  </p>
                ))}
                {errosParse.length > MAX_PREVIEW && (
                  <p className="font-medium">+ {errosParse.length - MAX_PREVIEW} outra(s) linha(s) com erro.</p>
                )}
              </div>
            )}

            {validos.length > 0 && (
              <div className="space-y-1.5">
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
                      {validos.slice(0, MAX_PREVIEW).map((l) => (
                        <TableRow key={l.linha}>
                          <TableCell className="font-medium">{l.matricula}</TableCell>
                          <TableCell>{l.nome}</TableCell>
                          <TableCell>{l.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {validos.length > MAX_PREVIEW && (
                  <p className="text-xs text-muted-foreground">
                    Mostrando as {MAX_PREVIEW} primeiras de {validos.length} linhas válidas.
                  </p>
                )}
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
                {errosExibidos.map((r) => (
                  <p key={r.linha}>
                    Linha {r.linha} ({r.matricula}): {r.motivoErro}
                  </p>
                ))}
                {comErro > MAX_PREVIEW && (
                  <p className="font-medium">+ {comErro - MAX_PREVIEW} outra(s) linha(s) com erro.</p>
                )}
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
