import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { negociacaoSchema, type NegociacaoFormValues } from "@/lib/validations";
import { currencyToNumber, numberToCurrencyInput } from "@/lib/masks";
import { NEGOCIACAO_STATUS } from "@/lib/constants";
import type { Negociacao } from "@/types";

interface NegociacaoFormProps {
  negociacao?: Negociacao | null;
  onSubmit: (values: NegociacaoFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  valoresIniciais?: Partial<NegociacaoFormValues>;
}

export function NegociacaoForm({
  negociacao,
  onSubmit,
  onCancel,
  submitting,
  valoresIniciais,
}: NegociacaoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NegociacaoFormValues>({
    resolver: zodResolver(negociacaoSchema),
    defaultValues: {
      valor_negociado: negociacao?.valor_negociado ?? valoresIniciais?.valor_negociado ?? 0,
      data_vencimento: negociacao?.data_vencimento ?? valoresIniciais?.data_vencimento ?? "",
      status: negociacao?.status ?? "Aguardando Pagamento",
      observacao: negociacao?.observacao ?? "",
    },
  });

  useEffect(() => {
    reset({
      valor_negociado: negociacao?.valor_negociado ?? valoresIniciais?.valor_negociado ?? 0,
      data_vencimento: negociacao?.data_vencimento ?? valoresIniciais?.data_vencimento ?? "",
      status: negociacao?.status ?? "Aguardando Pagamento",
      observacao: negociacao?.observacao ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [negociacao]);

  const status = watch("status");
  const valor = watch("valor_negociado");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valor_negociado">Valor negociado (R$) *</Label>
          <Input
            id="valor_negociado"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={valor ? numberToCurrencyInput(valor) : ""}
            onChange={(e) => setValue("valor_negociado", currencyToNumber(e.target.value))}
          />
          {errors.valor_negociado && (
            <p className="text-sm text-destructive">{errors.valor_negociado.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de vencimento *</Label>
          <Input id="data_vencimento" type="date" {...register("data_vencimento")} />
          {errors.data_vencimento && (
            <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={status} onValueChange={(v) => setValue("status", v as NegociacaoFormValues["status"])}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NEGOCIACAO_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observações</Label>
        <Textarea
          id="observacao"
          rows={3}
          placeholder="Detalhes sobre o acordo, condições de pagamento, etc."
          {...register("observacao")}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {negociacao ? "Salvar alterações" : "Registrar negociação"}
        </Button>
      </DialogFooter>
    </form>
  );
}
