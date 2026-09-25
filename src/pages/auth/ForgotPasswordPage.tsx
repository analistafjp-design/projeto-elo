import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setEnviando(true);
    const { error } = await sendPasswordReset(values.email);
    setEnviando(false);

    if (error) {
      toast.error(error);
      return;
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <AuthLayout title="Verifique seu e-mail" description="">
        <div className="flex flex-col items-center rounded-lg border border-border bg-white p-6 text-center">
          <MailCheck className="mb-3 h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            Enviamos um link de redefinição de senha para o seu e-mail. Verifique também a
            caixa de spam.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/entrar">Voltar para o login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe seu e-mail para receber o link de redefinição de senha."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar link de recuperação
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link to="/entrar" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthLayout>
  );
}
