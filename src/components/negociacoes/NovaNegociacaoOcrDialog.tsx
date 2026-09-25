import { useState } from "react";
import { toast } from "sonner";
import { ScanLine, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CameraCapture } from "@/components/comprovantes/CameraCapture";
import { OcrProcessor } from "@/components/comprovantes/OcrProcessor";
import { NegociacaoForm } from "./NegociacaoForm";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_MB } from "@/lib/constants";
import type { NegociacaoFormValues } from "@/lib/validations";
import type { OcrResultado } from "@/types";

interface NovaNegociacaoOcrDialogProps {
  criarNegociacao: (values: NegociacaoFormValues) => Promise<{ id: string }>;
  enviarComprovante: (params: {
    tipo: "Conta";
    file: File;
    negociacaoId: string;
  }) => Promise<unknown>;
}

/**
 * Fluxo de OCR completo:
 *   1. Usuário fotografa a conta.
 *   2. OCR (Tesseract.js) processa a imagem.
 *   3. Matrícula, nome, valor e data de vencimento são extraídos.
 *   4. O formulário de negociação é preenchido automaticamente.
 *   5. O usuário revisa/corrige e confirma o registro.
 *   6. A negociação é criada e a foto é anexada como comprovante do tipo "Conta".
 */
export function NovaNegociacaoOcrDialog({ criarNegociacao, enviarComprovante }: NovaNegociacaoOcrDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [ocrResultado, setOcrResultado] = useState<OcrResultado | null>(null);
  const [salvando, setSalvando] = useState(false);

  const reset = () => {
    setArquivo(null);
    setOcrResultado(null);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Envie uma foto em JPG ou PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`O arquivo deve ter no máximo ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setArquivo(file);
  };

  const handleSubmit = async (values: NegociacaoFormValues) => {
    setSalvando(true);
    try {
      const negociacao = await criarNegociacao(values);
      if (arquivo) {
        await enviarComprovante({ tipo: "Conta", file: arquivo, negociacaoId: negociacao.id });
      }
      toast.success("Negociação registrada e conta anexada com sucesso.");
      setAberto(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar negociação.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        setAberto(open);
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ScanLine className="h-4 w-4" />
          Nova negociação por foto (OCR)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova negociação a partir de foto</DialogTitle>
        </DialogHeader>

        {!arquivo ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <CameraCapture onCapture={handleFileChange} />
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" asChild className="w-full cursor-pointer">
                <span>
                  <Upload className="h-4 w-4" />
                  Escolher da galeria
                </span>
              </Button>
            </label>
          </div>
        ) : !ocrResultado ? (
          <OcrProcessor imagem={arquivo} onAplicar={setOcrResultado} />
        ) : (
          <NegociacaoForm
            valoresIniciais={{
              valor_negociado: ocrResultado.valor,
              data_vencimento: ocrResultado.dataVencimento,
            }}
            onSubmit={handleSubmit}
            onCancel={() => {
              setAberto(false);
              reset();
            }}
            submitting={salvando}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
