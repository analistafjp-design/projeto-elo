-- ============================================================
-- ELO | Script único de configuração do banco (SQL Editor)
--
-- Este arquivo reúne, em ordem, as migrações 0001 a 0005 de
-- supabase/migrations/ para que você possa colar TUDO de uma
-- vez só no SQL Editor do Supabase e clicar em "Run" uma única
-- vez, em vez de rodar arquivo por arquivo.
--
-- Ele é gerado a partir dos arquivos individuais — se você
-- alterar algo em supabase/migrations/, replique aqui também
-- (ou simplesmente volte a rodar os arquivos separados).
--
-- Não inclui a 0006 (seed opcional), que só deve rodar depois
-- de existir um usuário administrador.
-- ============================================================


-- ============================================================
-- 0001 — Perfis de usuário (profiles)
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  perfil text not null default 'operador' check (perfil in ('administrador', 'operador')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfis de usuário do sistema ELO (administrador ou operador).';

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_profiles integer;
  perfil_inicial text;
begin
  select count(*) into total_profiles from public.profiles;

  if total_profiles = 0 then
    perfil_inicial := 'administrador';
  else
    perfil_inicial := coalesce(new.raw_user_meta_data ->> 'perfil', 'operador');
    if perfil_inicial not in ('administrador', 'operador') then
      perfil_inicial := 'operador';
    end if;
  end if;

  insert into public.profiles (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    perfil_inicial
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.get_my_perfil()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select perfil from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select perfil from public.profiles where id = auth.uid()) = 'administrador', false);
$$;


-- ============================================================
-- 0002 — Tabelas principais
-- ============================================================

create extension if not exists pg_trgm;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  matricula text not null,
  nome text not null,
  telefone text,
  endereco text,
  email text,
  cpf text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo', 'Em Negociação')),
  operador_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clientes is 'Clientes acompanhados pelas equipes de campo.';

create unique index if not exists clientes_matricula_key on public.clientes (matricula);
create index if not exists clientes_nome_idx on public.clientes using gin (nome gin_trgm_ops);
create index if not exists clientes_telefone_idx on public.clientes (telefone);
create index if not exists clientes_operador_idx on public.clientes (operador_id);
create index if not exists clientes_status_idx on public.clientes (status);

drop trigger if exists set_updated_at on public.clientes;
create trigger set_updated_at
  before update on public.clientes
  for each row execute function public.handle_updated_at();

create table if not exists public.negociacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  valor_negociado numeric(12, 2) not null default 0,
  data_vencimento date not null,
  status text not null default 'Aguardando Pagamento'
    check (status in ('Aguardando Pagamento', 'Pago', 'Vencido', 'Em Acompanhamento')),
  observacao text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.negociacoes is 'Negociações financeiras vinculadas a um cliente.';

create index if not exists negociacoes_cliente_idx on public.negociacoes (cliente_id);
create index if not exists negociacoes_status_idx on public.negociacoes (status);
create index if not exists negociacoes_vencimento_idx on public.negociacoes (data_vencimento);

drop trigger if exists set_updated_at on public.negociacoes;
create trigger set_updated_at
  before update on public.negociacoes
  for each row execute function public.handle_updated_at();

create table if not exists public.comprovantes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  negociacao_id uuid references public.negociacoes (id) on delete set null,
  arquivo_url text not null,
  arquivo_path text not null,
  tipo text not null default 'Comprovante' check (tipo in ('Conta', 'Comprovante')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.comprovantes is 'Arquivos de contas e comprovantes de pagamento.';

create index if not exists comprovantes_cliente_idx on public.comprovantes (cliente_id);
create index if not exists comprovantes_negociacao_idx on public.comprovantes (negociacao_id);

create table if not exists public.interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo text not null check (tipo in ('Ligação', 'WhatsApp', 'Visita', 'Negociação')),
  descricao text,
  latitude double precision,
  longitude double precision,
  foto_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.interacoes is 'Histórico de interações e visitas realizadas com clientes.';

create index if not exists interacoes_cliente_idx on public.interacoes (cliente_id);
create index if not exists interacoes_tipo_idx on public.interacoes (tipo);
create index if not exists interacoes_created_idx on public.interacoes (created_at desc);

create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  negociacao_id uuid not null references public.negociacoes (id) on delete cascade,
  data_alerta date not null,
  status text not null default 'Pendente' check (status in ('Pendente', 'Enviado', 'Resolvido')),
  created_at timestamptz not null default now()
);

comment on table public.alertas is 'Alertas automáticos de vencimento de negociações.';

create index if not exists alertas_cliente_idx on public.alertas (cliente_id);
create index if not exists alertas_negociacao_idx on public.alertas (negociacao_id);
create index if not exists alertas_status_idx on public.alertas (status);
create unique index if not exists alertas_unicos_por_dia
  on public.alertas (negociacao_id, data_alerta);


-- ============================================================
-- 0003 — Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.negociacoes enable row level security;
alter table public.comprovantes enable row level security;
alter table public.interacoes enable row level security;
alter table public.alertas enable row level security;

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


-- ============================================================
-- 0004 — Storage: bucket "comprovantes" e políticas
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "comprovantes_storage_select" on storage.objects;
create policy "comprovantes_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprovantes'
    and public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "comprovantes_storage_insert" on storage.objects;
create policy "comprovantes_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprovantes'
    and public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "comprovantes_storage_update" on storage.objects;
create policy "comprovantes_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'comprovantes'
    and public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "comprovantes_storage_delete" on storage.objects;
create policy "comprovantes_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'comprovantes'
    and public.can_access_cliente(((storage.foldername(name))[1])::uuid)
  );


-- ============================================================
-- 0005 — Alertas automáticos e view do dashboard
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
  insert into public.alertas (cliente_id, negociacao_id, data_alerta, status)
  select n.cliente_id, n.id, current_date, 'Pendente'
  from public.negociacoes n
  where n.status in ('Aguardando Pagamento', 'Em Acompanhamento')
    and n.data_vencimento in (current_date, current_date + interval '1 day')
  on conflict (negociacao_id, data_alerta) do nothing;

  get diagnostics v_alertas_gerados = row_count;

  update public.negociacoes n
  set status = 'Vencido'
  where n.status in ('Aguardando Pagamento')
    and n.data_vencimento < current_date;

  get diagnostics v_negociacoes_vencidas = row_count;

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

-- ============================================================
-- Fim do script. Se tudo rodou sem erro, seu banco está pronto.
-- Próximo passo: cadastre-se pela tela do app (esse primeiro
-- usuário vira administrador automaticamente).
-- ============================================================
