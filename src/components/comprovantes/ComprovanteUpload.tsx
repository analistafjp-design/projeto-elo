import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileImage, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraCapture } from "./CameraCapture";
import { OcrProcessor } from "./OcrProcessor";
import { ACCEPTED_FILE_TYPES, ACCEPTED_MIME_TYPES, COMPROVANTE_TIPOS, MAX_FILE_SIZE_MB } from "@/lib/constants";
import type { Comprovante, ComprovanteTipo, OcrResultado } from "@/types";

interface ComprovanteUploadProps {
  enviar: (params: { tipo: ComprovanteTipo; file: File; negociacaoId?: string | null }) => Promise<Comprovante>;
  negociacaoId?: string | null;
  onOcrExtraido?: (resultado: OcrResultado) => void;
  trigger?: React.ReactNode;
}

export function ComprovanteUpload({ enviar, negociacaoId, onOcrExtraido, trigger }: ComprovanteUploadProps) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<ComprovanteTipo>("Comprovante");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  const previewUrl = arquivo && arquivo.type.startsWith("image/") ? URL.createObjectURL(arquivo) : null;

  const validarArquivo = (file: File): boolean => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Envie um arquivo JPG, PNG ou PDF.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`O arquivo deve ter no máximo ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!validarArquivo(file)) return;
    setArquivo(file);
  };

  const handleSubmit = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }
    setEnviando(true);
    try {
      await enviar({ tipo, file: arquivo, negociacaoId });
      toast.success("Comprovante enviado com sucesso.");
      setAberto(false);
      setArquivo(null);
      setTipo("Comprovante");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar arquivo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button">
            <Upload className="h-4 w-4" />
            Enviar comprovante
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar arquivo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de arquivo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as ComprovanteTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPROVANTE_TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!arquivo ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <CameraCapture onCapture={handleFileChange} />
              <label className="flex-1">
                <input
                  type="file"
                  accept={ACCEPTED_FILE_TYPES.join(",")}
                  hidden
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="outline" asChild className="w-full cursor-pointer">
                  <span>
                    <Upload className="h-4 w-4" />
                    Escolher arquivo
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg border border-border p-3">
                <button
                  type="button"
                  onClick={() => setArquivo(null)}
                  className="absolute right-2 top-2 rounded-full bg-white p-1 shadow hover:bg-muted"
                  aria-label="Remover arquivo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                {previewUrl ? (
                  <img src={previewUrl} alt="Pré-visualização" className="mx-auto max-h-56 rounded object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileImage className="h-5 w-5" />
                    {arquivo.name}
                  </div>
                )}
              </div>

              {tipo === "Conta" && arquivo.type.startsWith("image/") && onOcrExtraido && (
                <OcrProcessor imagem={arquivo} onAplicar={onOcrExtraido} />
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setAberto(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={enviando || !arquivo}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
