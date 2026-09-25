import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { VisitaForm } from "./VisitaForm";
import { interacaoSchema, type InteracaoFormValues } from "@/lib/validations";
import { INTERACAO_TIPOS } from "@/lib/constants";

interface InteracaoFormProps {
  onSubmit: (
    values: InteracaoFormValues & {
      foto?: File | null;
      coordenadas?: { latitude: number; longitude: number } | null;
    },
  ) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function InteracaoForm({ onSubmit, onCancel, submitting }: InteracaoFormProps) {
  const [foto, setFoto] = useState<File | null>(null);
  const [coordenadas, setCoordenadas] = useState<{ latitude: number; longitude: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InteracaoFormValues>({
    resolver: zodResolver(interacaoSchema),
    defaultValues: { tipo: "Ligação", descricao: "" },
  });

  const tipo = watch("tipo");

  const handleFormSubmit = async (values: InteracaoFormValues) => {
    await onSubmit({ ...values, foto, coordenadas: tipo === "Visita" ? coordenadas : null });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de interação *</Label>
        <Select value={tipo} onValueChange={(v) => setValue("tipo", v as InteracaoFormValues["tipo"])}>
          <SelectTrigger id="tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERACAO_TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Observação</Label>
        <Textarea
          id="descricao"
          rows={3}
          placeholder="Descreva o que foi tratado nesta interação..."
          {...register("descricao")}
        />
        {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
      </div>

      {tipo === "Visita" && (
        <VisitaForm foto={foto} onFotoChange={setFoto} onCoordenadasChange={setCoordenadas} />
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Registrar interação
        </Button>
      </DialogFooter>
    </form>
  );
}
