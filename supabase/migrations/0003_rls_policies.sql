-- ============================================================
-- ELO | Migration 0003
-- Row Level Security (RLS)
--
-- Regras de negócio:
--   Administrador -> visualiza, edita e exclui TUDO.
--   Operador      -> gerencia apenas os clientes vinculados a
--                     ele (clientes.operador_id = auth.uid())
--                     e todos os registros filhos desses
--                     clientes (negociações, comprovantes,
--                     interações, alertas).
-- ============================================================

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.negociacoes enable row level security;
alter table public.comprovantes enable row level security;
alter table public.interacoes enable row level security;
alter table public.alertas enable row level security;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    id = auth.uid() and (
      public.is_admin()
      or perfil = (select perfil from public.profiles where id = auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
drop policy if exists "clientes_select" on public.clientes;
create policy "clientes_select"
  on public.clientes for select
  to authenticated
  using (public.is_admin() or operador_id = auth.uid());

drop policy if exists "clientes_insert" on public.clientes;
create policy "clientes_insert"
  on public.clientes for insert
  to authenticated
  with check (
    public.is_admin() or operador_id = auth.uid()
  );

drop policy if exists "clientes_update" on public.clientes;
create policy "clientes_update"
  on public.clientes for update
  to authenticated
  using (public.is_admin() or operador_id = auth.uid())
  with check (public.is_admin() or operador_id = auth.uid());

drop policy if exists "clientes_delete" on public.clientes;
create policy "clientes_delete"
  on public.clientes for delete
  to authenticated
  using (public.is_admin() or operador_id = auth.uid());

-- ------------------------------------------------------------
-- Função auxiliar: verifica se o usuário atual pode acessar
-- um determinado cliente (admin ou dono).
-- ------------------------------------------------------------
create or replace function public.can_access_cliente(p_cliente_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.clientes c
    where c.id = p_cliente_id and c.operador_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- NEGOCIACOES
-- ------------------------------------------------------------
drop policy if exists "negociacoes_select" on public.negociacoes;
create policy "negociacoes_select"
  on public.negociacoes for select
  to authenticated
  using (public.can_access_cliente(cliente_id));

drop policy if exists "negociacoes_insert" on public.negociacoes;
create policy "negociacoes_insert"
  on public.negociacoes for insert
  to authenticated
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "negociacoes_update" on public.negociacoes;
create policy "negociacoes_update"
  on public.negociacoes for update
  to authenticated
  using (public.can_access_cliente(cliente_id))
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "negociacoes_delete" on public.negociacoes;
create policy "negociacoes_delete"
  on public.negociacoes for delete
  to authenticated
  using (public.can_access_cliente(cliente_id));

-- ------------------------------------------------------------
-- COMPROVANTES
-- ------------------------------------------------------------
drop policy if exists "comprovantes_select" on public.comprovantes;
create policy "comprovantes_select"
  on public.comprovantes for select
  to authenticated
  using (public.can_access_cliente(cliente_id));

drop policy if exists "comprovantes_insert" on public.comprovantes;
create policy "comprovantes_insert"
  on public.comprovantes for insert
  to authenticated
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "comprovantes_update" on public.comprovantes;
create policy "comprovantes_update"
  on public.comprovantes for update
  to authenticated
  using (public.can_access_cliente(cliente_id))
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "comprovantes_delete" on public.comprovantes;
create policy "comprovantes_delete"
  on public.comprovantes for delete
  to authenticated
  using (public.can_access_cliente(cliente_id));

-- ------------------------------------------------------------
-- INTERACOES
-- ------------------------------------------------------------
drop policy if exists "interacoes_select" on public.interacoes;
create policy "interacoes_select"
  on public.interacoes for select
  to authenticated
  using (public.can_access_cliente(cliente_id));

drop policy if exists "interacoes_insert" on public.interacoes;
create policy "interacoes_insert"
  on public.interacoes for insert
  to authenticated
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "interacoes_update" on public.interacoes;
create policy "interacoes_update"
  on public.interacoes for update
  to authenticated
  using (public.can_access_cliente(cliente_id))
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "interacoes_delete" on public.interacoes;
create policy "interacoes_delete"
  on public.interacoes for delete
  to authenticated
  using (public.can_access_cliente(cliente_id));

-- ------------------------------------------------------------
-- ALERTAS
-- ------------------------------------------------------------
drop policy if exists "alertas_select" on public.alertas;
create policy "alertas_select"
  on public.alertas for select
  to authenticated
  using (public.can_access_cliente(cliente_id));

drop policy if exists "alertas_insert" on public.alertas;
create policy "alertas_insert"
  on public.alertas for insert
  to authenticated
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "alertas_update" on public.alertas;
create policy "alertas_update"
  on public.alertas for update
  to authenticated
  using (public.can_access_cliente(cliente_id))
  with check (public.can_access_cliente(cliente_id));

drop policy if exists "alertas_delete" on public.alertas;
create policy "alertas_delete"
  on public.alertas for delete
  to authenticated
  using (public.can_access_cliente(cliente_id));
