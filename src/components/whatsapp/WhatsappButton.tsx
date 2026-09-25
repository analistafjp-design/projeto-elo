import { MessageCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { abrirWhatsapp } from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsappButtonProps extends Omit<ButtonProps, "onClick"> {
  nome: string;
  matricula: string;
  telefone: string | null | undefined;
  dataVencimento: string;
  label?: string;
  onSent?: () => void;
}

export function WhatsappButton({
  nome,
  matricula,
  telefone,
  dataVencimento,
  label = "Enviar lembrete",
  variant = "outline",
  size = "sm",
  className,
  onSent,
  ...props
}: WhatsappButtonProps) {
  const handleClick = () => {
    if (!telefone) {
      toast.error("Este cliente não possui telefone cadastrado.");
      return;
    }
    abrirWhatsapp({
      telefone,
      nome,
      matricula,
      dataVencimento: formatDate(dataVencimento),
    });
    onSent?.();
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      {...props}
    >
      <MessageCircle className="h-4 w-4 text-emerald-600" />
      {label}
    </Button>
  );
}
