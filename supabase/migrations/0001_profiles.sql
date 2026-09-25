-- ============================================================
-- ELO | Migration 0001
-- Perfis de usuário (profiles) vinculados ao auth.users
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: profiles
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Trigger genérica de updated_at
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Cria automaticamente um profile quando um novo usuário
-- se cadastra via Supabase Auth.
-- O primeiro usuário criado no sistema vira "administrador";
-- os demais entram como "operador" por padrão (ajustável depois
-- por um administrador).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Função auxiliar (security definer) para ler o perfil do
-- usuário autenticado sem cair em recursão de RLS.
-- ------------------------------------------------------------
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
