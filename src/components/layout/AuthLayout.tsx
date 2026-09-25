import type { ReactNode } from "react";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-1/2 flex-col justify-between bg-elo-blue-dark p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <svg viewBox="0 0 64 64" className="h-7 w-7">
              <circle cx="24" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
              <circle cx="40" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
            </svg>
          </div>
          <span className="text-xl font-bold">{APP_NAME}</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">{APP_SLOGAN}</h2>
          <p className="mt-4 text-white/70">
            Registre negociações, anexe comprovantes, receba alertas de vencimento e
            mantenha o histórico completo de cada cliente acompanhado em campo.
          </p>
        </div>

        <p className="text-xs text-white/40">ELO © {new Date().getFullYear()}</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-elo-gray-light p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-elo-blue-dark">
              <svg viewBox="0 0 64 64" className="h-6 w-6">
                <circle cx="24" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
                <circle cx="40" cy="32" r="12" fill="none" stroke="#fff" strokeWidth="5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-elo-blue-dark">{APP_NAME}</span>
          </div>

          <h1 className="text-2xl font-bold text-elo-blue-dark">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
