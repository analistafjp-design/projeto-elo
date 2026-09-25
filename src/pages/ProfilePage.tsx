import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/utils";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations";

export default function ProfilePage() {
  const { profile, user, refreshProfile, updatePassword } = useAuth();
  const [nome, setNome] = useState(profile?.nome ?? "");
  const [telefone, setTelefone] = useState(profile?.telefone ?? "");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const handleSalvarPerfil = async () => {
    if (!user) return;
    setSalvandoPerfil(true);
    try {
      const { error } = await supabase.from("profiles").update({ nome, telefone }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil.");
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleAlterarSenha = async (values: ResetPasswordFormValues) => {
    setSalvandoSenha(true);
    const { error } = await updatePassword(values.password);
    setSalvandoSenha(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Senha alterada com sucesso.");
    reset();
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Meu perfil" description="Gerencie suas informações pessoais e senha de acesso." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials(profile?.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile?.nome}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Badge variant="outline" className="mt-1 capitalize">
                {profile?.perfil}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={telefone ?? ""} onChange={(e) => setTelefone(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSalvarPerfil} disabled={salvandoPerfil}>
              {salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleAlterarSenha)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={salvandoSenha}>
                {salvandoSenha && <Loader2 className="h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
