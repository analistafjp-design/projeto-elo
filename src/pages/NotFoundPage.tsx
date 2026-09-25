import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CompassIcon } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-elo-gray-light p-6 text-center">
      <CompassIcon className="h-14 w-14 text-primary" />
      <h1 className="text-3xl font-bold text-elo-blue-dark">Página não encontrada</h1>
      <p className="max-w-sm text-muted-foreground">
        O endereço acessado não existe ou foi movido. Volte para o início do ELO.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
