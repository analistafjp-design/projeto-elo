import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { clienteSchema, type ClienteFormValues } from "@/lib/validations";
import { maskTelefone } from "@/lib/masks";
import { CLIENTE_STATUS } from "@/lib/constants";
import type { Cliente } from "@/types";

interface ClienteFormProps {
  cliente?: Cliente | null;
  onSubmit: (values: ClienteFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function ClienteForm({ cliente, onSubmit, onCancel, submitting }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      matricula: cliente?.matricula ?? "",
      nome: cliente?.nome ?? "",
      telefone: cliente?.telefone ?? "",
      endereco: cliente?.endereco ?? "",
      status: cliente?.status ?? "Ativo",
    },
  });

  useEffect(() => {
    reset({
      matricula: cliente?.matricula ?? "",
      nome: cliente?.nome ?? "",
      telefone: cliente?.telefone ?? "",
      endereco: cliente?.endereco ?? "",
      status: cliente?.status ?? "Ativo",
    });
  }, [cliente, reset]);

  const status = watch("status");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula *</Label>
          <Input id="matricula" placeholder="Ex: 000123" {...register("matricula")} />
          {errors.matricula && <p className="text-sm text-destructive">{errors.matricula.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(v) => setValue("status", v as ClienteFormValues["status"])}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENTE_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo *</Label>
        <Input id="nome" placeholder="Nome do cliente" {...register("nome")} />
        {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          placeholder="(00) 00000-0000"
          {...register("telefone")}
          onChange={(e) => setValue("telefone", maskTelefone(e.target.value))}
        />
        {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input id="endereco" placeholder="Rua, número, bairro, cidade" {...register("endereco")} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
