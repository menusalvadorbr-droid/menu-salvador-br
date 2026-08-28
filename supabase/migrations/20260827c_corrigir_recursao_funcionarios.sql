-- BUG CRÍTICO EM PRODUÇÃO (introduzido pela migration anterior,
-- 20260827_corrigir_rls_funcionarios_e_outras.sql): a policy
-- "acesso_funcionarios" criada ali consulta a própria tabela
-- `funcionarios` de dentro do seu USING (o branch "é funcionário ativo
-- deste estabelecimento?"), e como RLS acabou de ser habilitada nessa
-- tabela pela mesma migration, essa subconsulta reavalia a policy de
-- novo — recursão infinita ("infinite recursion detected in policy for
-- relation funcionarios"). Antes da migration anterior, `funcionarios`
-- não tinha RLS nenhuma, então esse padrão (usado em quase toda tabela
-- do projeto: owner_user_id = auth.uid() OR super_admin OR
-- exists(funcionarios ativo)) nunca disparava a recursão. Confirmado ao
-- vivo: qualquer consulta que passe por esse padrão — grid da home,
-- cardápio público (join com categorias) — quebrou.
--
-- Correção: extrai o branch "é funcionário ativo" pra uma function
-- security definer, que roda com privilégio do dono da function
-- (bypassa RLS ao consultar `funcionarios` internamente) — a mesma
-- técnica padrão pra quebrar esse tipo de recursão em RLS.
create or replace function public.eh_funcionario_ativo(p_estabelecimento_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.funcionarios f
    where f.estabelecimento_id = p_estabelecimento_id
      and f.user_id = p_user_id
      and f.ativo = true
  )
$$;

drop policy if exists "acesso_funcionarios" on public.funcionarios;
create policy "acesso_funcionarios" on public.funcionarios
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = funcionarios.estabelecimento_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or public.eh_funcionario_ativo(e.id, auth.uid())
        )
    )
  );
