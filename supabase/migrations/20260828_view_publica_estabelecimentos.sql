-- Fecha o vazamento de estabelecimentos.whatsapp_access_token/cnpj/socios
-- (flagado em 20260827_corrigir_rls_funcionarios_e_outras.sql, linhas
-- 34-40, e deixado "tratado à parte" na época). RLS é por linha, não por
-- coluna, e a tabela precisa continuar legível publicamente (nome,
-- endereço, bairro — usada pelo site inteiro) — não dá pra resolver só
-- ajustando a policy. Solução: view pública allow-list (só colunas
-- confirmadas necessárias por leitura pública, levantadas auditando as
-- 58 chamadas .from('estabelecimentos') do projeto) + policy da tabela
-- base apertada pro padrão de 3 vias (dono/funcionário/super_admin) já
-- usado em todo o resto do projeto.

-- ── VIEW PÚBLICA ────────────────────────────────────────────────────
-- Sem "with (security_invoker = ...)" de propósito: o padrão do Postgres
-- (security_invoker = false) faz a view rodar com o privilégio de quem
-- criou ela (o executor da migration), não de quem consulta — é assim
-- que ela consegue devolver dados mesmo com a tabela base tendo RLS
-- restrita a dono/funcionário/admin. Nunca adicionar
-- "security_invoker = true" aqui, quebraria o propósito inteiro da view.
--
-- cnpj só aparece quando o estabelecimento não tem dono (owner_user_id
-- nulo) — é o dado que os links "reivindicar este estabelecimento"
-- (cardapio/[slug]/page.tsx, [...slug]/page.tsx) precisam pra visitante
-- anônimo poder reivindicar. Estabelecimento já reivindicado nunca expõe
-- o cnpj por aqui.
create or replace view public.estabelecimentos_publico as
select
  id, nome, nome_fantasia, slug, descricao, status, ativo, destaque,
  endereco, numero, complemento, tipo_logradouro, cep, bairro, bairro_id, cidade, cidade_id,
  telefone, whatsapp, instagram,
  tipo_estabelecimento, tipo_estabelecimento_id,
  estacionamento, aceita_pets, acessibilidade, latitude, longitude, link_google_maps,
  foto_capa, galeria_fotos, logo_url, google_place_id,
  tema_atual_id, cardapio_config, cardapio_formato, cardapio_navegacao_categoria,
  cardapio_clique_expande_ativado, cardapio_carrinho_ativado, cardapio_variacoes_ativado, cardapio_complementos_ativado,
  promocoes_contador_ativado, idiomas_ativos, whatsapp_atalhos, qrcode_short_url,
  chave_pix, tipo_chave_pix,
  owner_user_id,
  case when owner_user_id is null then cnpj else null end as cnpj
from public.estabelecimentos;

grant select on public.estabelecimentos_publico to anon, authenticated;

-- ── RPC PRA BUSCA POR CNPJ ──────────────────────────────────────────
-- NovoEstabelecimentoForm.tsx precisa buscar POR cnpj digitado por
-- qualquer usuário logado, pra detectar duplicata/estabelecimento já
-- reivindicado — o inverso do caso que a view cobre (lá já se sabe o
-- estabelecimento e só mostra cnpj se não tiver dono; aqui busca-se
-- pelo cnpj em si). security definer pra poder consultar a coluna
-- sensível internamente sem reexpor o valor — quem chama já sabe o cnpj
-- que buscou, não precisa dele de volta.
create or replace function public.buscar_estabelecimento_por_cnpj(p_cnpj text)
returns table (id uuid, nome text, nome_fantasia text, slug text, owner_user_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select e.id, e.nome, e.nome_fantasia, e.slug, e.owner_user_id
  from public.estabelecimentos e
  where e.cnpj = p_cnpj
  limit 1
$$;

grant execute on function public.buscar_estabelecimento_por_cnpj(text) to authenticated;

-- ── POLICIES DA TABELA BASE ─────────────────────────────────────────
-- estabelecimentos foi criada antes do diretório de migrations (via
-- Table Editor) — sem registro dos nomes/redação exata das policies
-- atuais. Em vez de tentar adivinhar nomes pra dar drop, remove
-- dinamicamente todas as policies existentes na tabela (via
-- pg_policies, sem depender de nome) e recria um conjunto novo e
-- explícito — mesma filosofia já usada pra categorias na migration
-- 20260827_corrigir_rls_funcionarios_e_outras.sql ("não dá pra saber se
-- estavam corretas, nunca foram testadas de verdade rodando").
alter table public.estabelecimentos enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'estabelecimentos'
  loop
    execute format('drop policy %I on public.estabelecimentos', pol.policyname);
  end loop;
end $$;

create policy "estabelecimentos_select_dono_funcionario_admin" on public.estabelecimentos
  for select using (
    owner_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
    or public.eh_funcionario_ativo(id, auth.uid())
  );

-- Cobre tanto o cadastro normal (NovoEstabelecimentoForm.tsx, sempre
-- com owner_user_id = auth.uid()) quanto os fluxos /admin que inserem
-- com client de sessão (checarSuperAdmin(), não supabaseAdmin).
create policy "estabelecimentos_insert_proprio_ou_admin" on public.estabelecimentos
  for insert with check (
    owner_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

create policy "estabelecimentos_update_dono_funcionario_admin" on public.estabelecimentos
  for update using (
    owner_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
    or public.eh_funcionario_ativo(id, auth.uid())
  );

-- Sem policy de DELETE de propósito: nenhum lugar do código faz delete
-- direto em estabelecimentos (exclusão é sempre soft-delete via UPDATE
-- status='excluido', ou hard-delete via supabaseAdmin, que bypassa RLS
-- de qualquer forma) — sem policy permissiva, DELETE via API fica
-- sempre negado, que é o comportamento certo.
