import { z } from "zod";
import { isValidCPF } from "./masks";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    nome: z.string().min(3, "Informe seu nome completo."),
    email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const clienteSchema = z.object({
  matricula: z.string().min(1, "Informe a matrícula."),
  nome: z.string().min(3, "Informe o nome completo."),
  telefone: z
    .string()
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, {
      message: "Telefone inválido.",
    }),
  endereco: z.string().optional(),
  email: z.string().optional().refine((v) => !v || z.string().email().safeParse(v).success, {
    message: "E-mail inválido.",
  }),
  cpf: z.string().optional().refine((v) => !v || isValidCPF(v), { message: "CPF inválido." }),
  status: z.enum(["Ativo", "Inativo", "Em Negociação"]),
});
export type ClienteFormValues = z.infer<typeof clienteSchema>;

export const negociacaoSchema = z.object({
  valor_negociado: z.number({ invalid_type_error: "Informe um valor válido." }).positive("O valor deve ser maior que zero."),
  data_vencimento: z.string().min(1, "Informe a data de vencimento."),
  status: z.enum(["Aguardando Pagamento", "Pago", "Vencido", "Em Acompanhamento"]),
  observacao: z.string().optional(),
});
export type NegociacaoFormValues = z.infer<typeof negociacaoSchema>;

export const interacaoSchema = z.object({
  tipo: z.enum(["Ligação", "WhatsApp", "Visita", "Negociação"]),
  descricao: z.string().optional(),
});
export type InteracaoFormValues = z.infer<typeof interacaoSchema>;
