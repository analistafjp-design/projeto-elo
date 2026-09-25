import { AlertTriangle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function ConfiguracaoPendente() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-elo-gray-light p-6">
      <div className="w-full max-w-lg rounded-lg border border-amber-300 bg-white p-6 shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-elo-blue-dark">
          Configuração do {APP_NAME} pendente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          As variáveis de ambiente do Supabase ainda não foram configuradas. Para colocar o
          sistema em funcionamento, siga os passos abaixo:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>
            Copie o arquivo <code className="rounded bg-muted px-1 py-0.5">.env.example</code>{" "}
            para <code className="rounded bg-muted px-1 py-0.5">.env</code>.
          </li>
          <li>
            Acesse seu projeto no{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              painel do Supabase
            </a>{" "}
            em <em>Project Settings → API</em>.
          </li>
          <li>
            Copie a <strong>Project URL</strong> para{" "}
            <code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_URL</code>.
          </li>
          <li>
            Copie a chave <strong>anon public</strong> para{" "}
            <code className="rounded bg-muted px-1 py-0.5">VITE_SUPABASE_ANON_KEY</code>.
          </li>
          <li>Salve o arquivo e reinicie o servidor de desenvolvimento.</li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          O passo a passo completo está na seção <strong>CONFIGURAÇÃO MANUAL</strong> do
          README.md do projeto.
        </p>
      </div>
    </div>
  );
}
