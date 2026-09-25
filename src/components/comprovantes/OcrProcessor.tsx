import { useState } from "react";
import { Loader2, ScanText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { processarOcr } from "@/lib/ocr";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { OcrResultado } from "@/types";

interface OcrProcessorProps {
  imagem: File;
  onAplicar: (resultado: OcrResultado) => void;
}

/**
 * Executa o OCR (Tesseract.js) sobre a imagem da conta e exibe os
 * campos extraídos (matrícula, nome, valor, vencimento), permitindo
 * correção manual antes de aplicar ao formulário de negociação.
 */
export function OcrProcessor({ imagem, onAplicar }: OcrProcessorProps) {
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<OcrResultado | null>(null);
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  const executar = async () => {
    setProcessando(true);
    try {
      const res = await processarOcr(imagem);
      setResultado(res);
      setMatricula(res.matricula ?? "");
      setNome(res.nome ?? "");
      setValor(res.valor ? String(res.valor) : "");
      setDataVencimento(res.dataVencimento ?? "");

      if (!res.matricula && !res.nome && !res.valor && !res.dataVencimento) {
        toast.warning(
          "Não conseguimos identificar os dados automaticamente. Preencha manualmente abaixo.",
        );
      } else {
        toast.success("Dados extraídos! Confira e corrija se necessário.");
      }
    } catch (err) {
      toast.error("Erro ao processar OCR. Tente novamente ou preencha manualmente.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setProcessando(false);
    }
  };

  const aplicar = () => {
    onAplicar({
      matricula: matricula || undefined,
      nome: nome || undefined,
      valor: valor ? parseFloat(valor) : undefined,
      dataVencimento: dataVencimento || undefined,
      textoCompleto: resultado?.textoCompleto ?? "",
      confianca: resultado?.confianca ?? 0,
    });
  };

  if (!resultado) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <ScanText className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Utilize o reconhecimento automático de texto (OCR) para preencher a
            negociação a partir da foto da conta.
          </p>
          <Button type="button" onClick={executar} disabled={processando}>
            {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
            {processando ? "Processando imagem..." : "Processar com OCR"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-elo-blue-lighter/40">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Dados extraídos (confiança: {Math.round(resultado.confianca)}%)
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ocr-matricula">Matrícula</Label>
            <Input id="ocr-matricula" value={matricula} onChange={(e) => setMatricula(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ocr-nome">Nome</Label>
            <Input id="ocr-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ocr-valor">Valor (R$)</Label>
            <Input
              id="ocr-valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ocr-data">Data de vencimento</Label>
            <Input
              id="ocr-data"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
            />
            {dataVencimento && (
              <p className="text-xs text-muted-foreground">{formatDate(dataVencimento)}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={executar} disabled={processando}>
            Processar novamente
          </Button>
          <Button type="button" size="sm" onClick={aplicar}>
            Usar estes dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
