-- ============================================================
-- ELO | Migration 0004
-- Storage: bucket "comprovantes" e políticas de acesso
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes',
  'comprovantes',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Estrutura de caminho esperada: comprovantes/{cliente_id}/{arquivo}
-- Assim conseguimos aplicar RLS reaproveitando can_access_cliente().

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
