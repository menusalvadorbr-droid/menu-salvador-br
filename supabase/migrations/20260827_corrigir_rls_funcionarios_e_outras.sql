-- Auditoria completa das 30 tabelas com estabelecimento_id, testada de
-- verdade com dois donos genuinamente sem relação entre si (não com o
-- mesmo usuário de teste contra estabelecimentos que ele também possui —
-- erro cometido numa primeira rodada de testes, que apontou vazamento em
-- ~24 tabelas que na verdade já estavam corretas; a segunda rodada, com
-- contas de verdade sem vínculo, achou só 4 problemas reais):
--
-- - funcionarios: SELECT vazava (lista de quem trabalha em qualquer
--   estabelecimento, incl. cargo, ficava visível pra qualquer usuário
--   logado). UPDATE/DELETE já estavam protegidos.
-- - vinculo_contestacoes: SELECT vazava (contestações de vínculo de
--   qualquer estabelecimento, incl. justificativa). UPDATE/DELETE já
--   protegidos.
-- - google_reviews_cache: SELECT vazava (cache de avaliações do Google de
--   qualquer estabelecimento). Baixa sensibilidade (são avaliações
--   públicas do próprio Google), mas sem uso legítimo de leitura pública
--   direta nesta tabela (o consumo público de reviews passa por
--   supabaseAdmin no servidor, não pela API com RLS) — trancada também.
--   UPDATE/DELETE já protegidos.
-- - restaurant_members: tabela morta (zero linhas em produção, nenhum
--   arquivo do projeto referencia ela — substituída por funcionarios em
--   algum momento). RLS incluída por precaução, já que continua exposta
--   pela API mesmo sem uso.
--
-- Todas as outras 26 tabelas testadas (grupos_complementos, fichas_tecnicas,
-- caixa_movimentacoes, orders, chamados_garcom, pagamentos_mesa,
-- estabelecimento_tipos_cozinha, movimentos_estoque, horarios_funcionamento,
-- special_offers, fornecedores, menus, pedidos_compra, whatsapp_metricas_log,
-- validacao_pedidos, coupons, insumos, whatsapp_conversas,
-- pedidos_acompanhamento, mesas, whatsapp_numero_estabelecimento, traducoes,
-- caixa_sessoes, scans_qrcode, loyalty_accounts, restaurant_claims) já
-- tinham RLS correta — nenhuma mudança necessária nelas.
--
-- estabelecimentos.whatsapp_access_token/cnpj/socios (SELECT também vaza,
-- confirmado) fica de fora desta migration de propósito: essa tabela
-- precisa continuar legível publicamente pra bairro/nome/endereço (usada
-- pelo site público inteiro), então a mesma policy de 3 vias quebraria o
-- site — precisa de uma view pública só com colunas seguras + apontar o
-- código público pra ela, não é um ajuste de policy sozinho. Tratado à
-- parte.

alter table public.funcionarios enable row level security;
drop policy if exists "acesso_funcionarios" on public.funcionarios;
create policy "acesso_funcionarios" on public.funcionarios
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = funcionarios.estabelecimento_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

alter table public.vinculo_contestacoes enable row level security;
drop policy if exists "acesso_vinculo_contestacoes" on public.vinculo_contestacoes;
create policy "acesso_vinculo_contestacoes" on public.vinculo_contestacoes
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = vinculo_contestacoes.estabelecimento_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

alter table public.google_reviews_cache enable row level security;
drop policy if exists "acesso_google_reviews_cache" on public.google_reviews_cache;
create policy "acesso_google_reviews_cache" on public.google_reviews_cache
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = google_reviews_cache.estabelecimento_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

alter table public.restaurant_members enable row level security;
drop policy if exists "acesso_restaurant_members" on public.restaurant_members;
create policy "acesso_restaurant_members" on public.restaurant_members
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = restaurant_members.estabelecimento_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

-- ── Achados do Supabase Advisor (checagem automática que roda por cima de
-- toda a auditoria manual acima) — 2 problemas reais, fora do escopo de
-- "tabelas com estabelecimento_id" que a auditoria manual cobriu ──────────

-- CRÍTICO, ativo e explorável agora: categorias já tinha 3 policies
-- escritas (allow_select_public_categorias, categorias_manage_owner,
-- categorias_select) mas RLS nunca foi habilitada na tabela — policy
-- sem RLS habilitada não vale nada, o Postgres ignora todas. Confirmado
-- ao vivo: um visitante 100% anônimo (sem login nenhum) conseguiu
-- renomear uma categoria de cardápio real. Substitui as 3 policies
-- antigas (não dá pra saber se estavam corretas, nunca foram testadas
-- de verdade rodando) por 2 novas e claras: leitura pública (cardápio
-- é público) e escrita só pro dono/funcionário/super_admin do
-- estabelecimento dono do menu daquela categoria.
alter table public.categorias enable row level security;
drop policy if exists "allow_select_public_categorias" on public.categorias;
drop policy if exists "categorias_manage_owner" on public.categorias;
drop policy if exists "categorias_select" on public.categorias;

create policy "categorias_leitura_publica" on public.categorias
  for select using (true);

create policy "categorias_escrita_dono" on public.categorias
  for insert with check (
    exists (
      select 1 from public.menus m
      join public.estabelecimentos e on e.id = m.estabelecimento_id
      where m.id = categorias.menu_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

create policy "categorias_atualizacao_dono" on public.categorias
  for update using (
    exists (
      select 1 from public.menus m
      join public.estabelecimentos e on e.id = m.estabelecimento_id
      where m.id = categorias.menu_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

create policy "categorias_exclusao_dono" on public.categorias
  for delete using (
    exists (
      select 1 from public.menus m
      join public.estabelecimentos e on e.id = m.estabelecimento_id
      where m.id = categorias.menu_id
        and (
          e.owner_user_id = auth.uid()
          or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
          or exists (
            select 1 from public.funcionarios f
            where f.estabelecimento_id = e.id and f.user_id = auth.uid() and f.ativo = true
          )
        )
    )
  );

-- CRÍTICO: verification_tokens (41 linhas reais, coluna `token`) também
-- sem RLS nenhuma — confirmado que um anônimo conseguia ler. Não
-- referenciada em nenhum lugar do código do projeto (src/); todos os
-- tokens encontrados já estão com expires_at vencido há mais de 2 meses,
-- então o risco imediato é baixo, mas a tabela continua exposta pra
-- qualquer token futuro que caia nela. Sem nenhum uso legítimo
-- identificado via API com sessão de usuário — tranca completamente
-- (só service_role, que ignora RLS por padrão, continua enxergando).
alter table public.verification_tokens enable row level security;
drop policy if exists "bloqueia_tudo_verification_tokens" on public.verification_tokens;
create policy "bloqueia_tudo_verification_tokens" on public.verification_tokens
  for all using (false);
