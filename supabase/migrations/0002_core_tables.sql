-- ============================================================
-- ELO | Migration 0002
-- Tabelas principais: clientes, negociacoes, comprovantes,
-- interacoes, alertas
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: clientes
-- ------------------------------------------------------------
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

create extension if not exists pg_trgm;

drop trigger if exists set_updated_at on public.clientes;
create trigger set_updated_at
  before update on public.clientes
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- Tabela: negociacoes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Tabela: comprovantes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Tabela: interacoes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Tabela: alertas
-- ------------------------------------------------------------
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
