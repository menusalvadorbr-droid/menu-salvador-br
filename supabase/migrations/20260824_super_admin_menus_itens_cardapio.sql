-- Bug confirmado ao vivo: super_admin tentando criar/editar cardápio de um
-- estabelecimento ainda não reivindicado (owner_user_id null — ex: importado
-- via /admin/estabelecimentos/novo, esperando alguém reivindicar) recebia
-- 42501 "new row violates row-level security policy" ao criar o menu
-- (menus) e ao inserir item (itens_cardapio). categorias já não tinha esse
-- problema — só as outras duas.
--
-- Causa: a RLS dessas duas tabelas só cobre dono (owner_user_id =
-- auth.uid()) e funcionário ativo, sem a checagem de super_admin — faz
-- sentido pro dono/funcionário, porque sempre existe um estabelecimento_id
-- pra checar contra auth.uid(), mas falha quando NINGUÉM é dono ainda e
-- quem está editando é o super_admin.
--
-- Fix: adiciona uma policy NOVA em vez de tocar nas existentes. RLS
-- combina policies permissivas com OR — isso só amplia quem tem acesso de
-- escrita (super_admin), sem risco de derrubar a leitura pública do
-- cardápio (SELECT anônimo, usada em /cardapio/[slug]) nem o acesso já
-- funcionando de dono/funcionário. is_super_admin() sem argumento — mesma
-- função já usada no resto do projeto, em vez de reescrever a checagem
-- contra profiles.role na mão.
create policy "super_admin_gerencia_menus" on public.menus
  for all
  to authenticated
  using (is_super_admin())
  with check (is_super_admin());

create policy "super_admin_gerencia_itens_cardapio" on public.itens_cardapio
  for all
  to authenticated
  using (is_super_admin())
  with check (is_super_admin());
