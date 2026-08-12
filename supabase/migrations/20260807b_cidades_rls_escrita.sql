-- A migração anterior (20260807_slugs_canonicos.sql) ativou RLS em
-- `cidades` mas só criou a policy de leitura pública — faltou a de
-- escrita pro admin geral, usada em /admin/tipos → Cidades
-- (src/app/(admin)/admin/cidades/actions.ts, via checarSuperAdmin, que
-- lê com o client do usuário logado, respeitando RLS normalmente).

drop policy if exists "cidades: escrita super admin" on public.cidades;
create policy "cidades: escrita super admin" on public.cidades
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));
