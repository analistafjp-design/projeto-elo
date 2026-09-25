// ============================================================
// ELO | Edge Function: gerar-alertas
//
// Executa a rotina de alertas automáticos de vencimento:
//   - 1 dia antes do vencimento -> gera alerta
//   - No dia do vencimento -> gera alerta
//   - Após o vencimento -> marca negociação como "Vencido"
//
// Agendamento recomendado: diariamente às 07:00 (horário de
// Brasília), via Scheduled Trigger no painel do Supabase
// (Edge Functions > gerar-alertas > Schedule) ou pg_cron:
//
//   select cron.schedule(
//     'elo-gerar-alertas-diario',
//     '0 10 * * *', -- 07:00 America/Sao_Paulo (UTC-3)
//     $$ select net.http_post(
//          url := '<SUPABASE_URL>/functions/v1/gerar-alertas',
//          headers := jsonb_build_object(
//            'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
//            'Content-Type', 'application/json'
//          )
//        ); $$
//   );
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.rpc("gerar_alertas_vencimento");

    if (error) {
      console.error("Erro ao gerar alertas:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    return new Response(
      JSON.stringify({
        sucesso: true,
        executado_em: new Date().toISOString(),
        resultado,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Falha inesperada na função gerar-alertas:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
