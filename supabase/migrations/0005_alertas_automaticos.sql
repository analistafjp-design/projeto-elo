-- ============================================================
-- ELO | Migration 0005
-- Regras automáticas de alertas e atualização de status
--
--   1 dia antes do vencimento -> gera alerta (status Pendente)
--   No dia do vencimento      -> gera alerta (status Pendente)
--   Após o vencimento         -> marca a negociação como
--                                 "Vencido" (Em Acompanhamento
--                                 quando já havia observação
--                                 de acompanhamento) e cria/mantém
--                                 alerta
--
-- Esta função é chamada periodicamente pela Edge Function
-- "gerar-alertas" (ver supabase/functions/gerar-alertas), que
-- pode ser agendada via pg_cron/Scheduled Trigger no painel do
-- Supabase ou por um cron externo (ex: GitHub Actions, Vercel Cron).
-- ============================================================

create or replace function public.gerar_alertas_vencimento()
returns table (alertas_gerados integer, negociacoes_marcadas_vencidas integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alertas_gerados integer := 0;
  v_negociacoes_vencidas integer := 0;
begin
  -- Alertas para negociações que vencem amanhã ou hoje
  insert into public.alertas (cliente_id, negociacao_id, data_alerta, status)
  select n.cliente_id, n.id, current_date, 'Pendente'
  from public.negociacoes n
  where n.status in ('Aguardando Pagamento', 'Em Acompanhamento')
    and n.data_vencimento in (current_date, current_date + interval '1 day')
  on conflict (negociacao_id, data_alerta) do nothing;

  get diagnostics v_alertas_gerados = row_count;

  -- Marca como vencidas as negociações cuja data já passou
  update public.negociacoes n
  set status = 'Vencido'
  where n.status in ('Aguardando Pagamento')
    and n.data_vencimento < current_date;

  get diagnostics v_negociacoes_vencidas = row_count;

  -- Garante um alerta pendente para toda negociação recém vencida
  insert into public.alertas (cliente_id, negociacao_id, data_alerta, status)
  select n.cliente_id, n.id, current_date, 'Pendente'
  from public.negociacoes n
  where n.status = 'Vencido'
    and n.data_vencimento < current_date
  on conflict (negociacao_id, data_alerta) do nothing;

  return query select v_alertas_gerados, v_negociacoes_vencidas;
end;
$$;

comment on function public.gerar_alertas_vencimento() is
  'Gera alertas de vencimento (1 dia antes / no dia) e marca negociações vencidas. Chamada pela Edge Function gerar-alertas.';

-- ------------------------------------------------------------
-- View utilitária para o Dashboard (evita recalcular agregações
-- repetidamente no client).
-- ------------------------------------------------------------
create or replace view public.vw_dashboard_resumo
with (security_invoker = true) as
select
  (select count(*) from public.clientes) as clientes_total,
  (select count(*) from public.negociacoes
    where status in ('Aguardando Pagamento', 'Em Acompanhamento')) as negociacoes_ativas,
  (select coalesce(sum(valor_negociado), 0) from public.negociacoes) as valor_negociado_total,
  (select coalesce(sum(valor_negociado), 0) from public.negociacoes
    where status = 'Pago') as valor_recuperado_total,
  (select count(*) from public.negociacoes n
    where n.status <> 'Pago' and not exists (
      select 1 from public.comprovantes c where c.negociacao_id = n.id and c.tipo = 'Comprovante'
    )) as comprovantes_pendentes,
  (select count(*) from public.negociacoes where status = 'Vencido') as negociacoes_vencidas;

comment on view public.vw_dashboard_resumo is 'Resumo agregado para os cards do dashboard executivo.';
