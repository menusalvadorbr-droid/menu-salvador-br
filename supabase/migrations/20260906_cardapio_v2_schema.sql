-- Cardápio V2 — schema novo, construído do zero em paralelo ao V1 (ver
-- cardapio-v2-visao.md na raiz do repo). Isolamento total: tabelas com
-- prefixo cardapio_v2_, nenhuma FK pra menus/categorias/itens_cardapio do
-- V1. A única tabela do V1 reaproveitada é public.allergens — lista
-- genérica de alérgenos já compartilhada por item_allergens (cardápio V1)
-- e insumo_allergens (estoque, ver 20260802_ficha_tecnica.sql), não é
-- código de domínio do cardápio V1, é taxonomia comum.

-- ── cardapio_v2_cardapios — múltiplos cardápios por estabelecimento
-- (ex: presencial e delivery como cardápios distintos) ──────────────────
create table if not exists public.cardapio_v2_cardapios (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  canal_padrao text not null default 'ambos' check (canal_padrao in ('presencial', 'delivery', 'ambos')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_cardapio_v2_cardapios_estabelecimento on public.cardapio_v2_cardapios(estabelecimento_id);

-- ── cardapio_v2_categorias ───────────────────────────────────────────────
create table if not exists public.cardapio_v2_categorias (
  id uuid primary key default gen_random_uuid(),
  cardapio_id uuid not null references public.cardapio_v2_cardapios(id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_cardapio_v2_categorias_cardapio on public.cardapio_v2_categorias(cardapio_id);

-- ── cardapio_v2_itens ─────────────────────────────────────────────────────
create table if not exists public.cardapio_v2_itens (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.cardapio_v2_categorias(id) on delete cascade,
  nome text not null,
  descricao text,
  foto_url text,
  preco_base numeric(10,2) not null default 0,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cardapio_v2_itens_categoria on public.cardapio_v2_itens(categoria_id);

-- ── cardapio_v2_variacoes — tamanho/preço como entidade do item, não do
-- carrinho (é essa a mudança que resolve variação só funcionar no
-- carrinho do cliente no V1) ─────────────────────────────────────────────
create table if not exists public.cardapio_v2_variacoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  nome text not null,
  preco numeric(10,2) not null,
  ordem int not null default 0
);

create index if not exists idx_cardapio_v2_variacoes_item on public.cardapio_v2_variacoes(item_id);

-- ── preço por canal — item e variação, ambos opcionais: ausência de
-- linha aqui significa "usar preco_base/preco padrão" pro canal ─────────
create table if not exists public.cardapio_v2_item_precos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  canal text not null check (canal in ('presencial', 'delivery')),
  preco numeric(10,2) not null,
  unique (item_id, canal)
);

create table if not exists public.cardapio_v2_variacao_precos (
  id uuid primary key default gen_random_uuid(),
  variacao_id uuid not null references public.cardapio_v2_variacoes(id) on delete cascade,
  canal text not null check (canal in ('presencial', 'delivery')),
  preco numeric(10,2) not null,
  unique (variacao_id, canal)
);

-- ── grupos de complemento — reutilizáveis entre itens (N:N via tabela de
-- junção abaixo), com regra de mínimo/máximo de escolha ─────────────────
create table if not exists public.cardapio_v2_grupos_complemento (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  minimo int not null default 0,
  maximo int not null default 1,
  created_at timestamptz not null default now(),
  check (minimo >= 0 and maximo >= minimo)
);

create index if not exists idx_cardapio_v2_grupos_complemento_estabelecimento on public.cardapio_v2_grupos_complemento(estabelecimento_id);

create table if not exists public.cardapio_v2_grupo_complemento_opcoes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.cardapio_v2_grupos_complemento(id) on delete cascade,
  nome text not null,
  preco_adicional numeric(10,2) not null default 0,
  ordem int not null default 0
);

create index if not exists idx_cardapio_v2_grupo_complemento_opcoes_grupo on public.cardapio_v2_grupo_complemento_opcoes(grupo_id);

create table if not exists public.cardapio_v2_item_grupos_complemento (
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  grupo_id uuid not null references public.cardapio_v2_grupos_complemento(id) on delete cascade,
  ordem int not null default 0,
  primary key (item_id, grupo_id)
);

-- ── cardapio_v2_regras_exibicao — disponibilidade + promoção + destaque
-- unificados numa única tabela com discriminador `tipo`. No V1 esses 3
-- mecanismos são fragmentados/paralelos (motivo citado em
-- cardapio-v2-visao.md); aqui é a mesma tabela, filtrada por tipo, então
-- ler "o que está ativo agora" é uma query só, não três. ─────────────────
create table if not exists public.cardapio_v2_regras_exibicao (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  tipo text not null check (tipo in ('disponibilidade', 'promocao', 'destaque')),
  item_id uuid references public.cardapio_v2_itens(id) on delete cascade,
  categoria_id uuid references public.cardapio_v2_categorias(id) on delete cascade,
  -- janela de tempo, usada por disponibilidade e promocao; null = sem
  -- restrição naquele campo (todo dia / dia inteiro / sem prazo de validade)
  dias_semana int[],
  horario_de time,
  horario_ate time,
  disponivel boolean,
  promocao_preco numeric(10,2),
  promocao_valida_de timestamptz,
  promocao_valida_ate timestamptz,
  destaque boolean,
  ordem_destaque int,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (item_id is not null and categoria_id is null) or
    (item_id is null and categoria_id is not null)
  )
);

create index if not exists idx_cardapio_v2_regras_exibicao_item on public.cardapio_v2_regras_exibicao(item_id) where item_id is not null;
create index if not exists idx_cardapio_v2_regras_exibicao_categoria on public.cardapio_v2_regras_exibicao(categoria_id) where categoria_id is not null;
create index if not exists idx_cardapio_v2_regras_exibicao_estabelecimento_tipo on public.cardapio_v2_regras_exibicao(estabelecimento_id, tipo);

-- ── traduções — campo `origem` aguenta tradução manual hoje e automática
-- por IA depois, sem precisar mudar schema quando isso for construído ────
create table if not exists public.cardapio_v2_traducoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.cardapio_v2_itens(id) on delete cascade,
  categoria_id uuid references public.cardapio_v2_categorias(id) on delete cascade,
  idioma text not null,
  campo text not null check (campo in ('nome', 'descricao')),
  texto text not null,
  origem text not null default 'manual' check (origem in ('manual', 'ia')),
  created_at timestamptz not null default now(),
  check (
    (item_id is not null and categoria_id is null) or
    (item_id is null and categoria_id is not null)
  ),
  unique (item_id, categoria_id, idioma, campo)
);

-- ── alérgenos — reaproveita public.allergens (mesma tabela já usada por
-- item_allergens do V1 e insumo_allergens do estoque), não cria lista
-- paralela ────────────────────────────────────────────────────────────
create table if not exists public.cardapio_v2_item_allergens (
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  primary key (item_id, allergen_id)
);

create table if not exists public.cardapio_v2_item_tags (
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  tag text not null,
  primary key (item_id, tag)
);

-- ── contagem simples de acesso ao QR — append-only, um insert por scan ──
create table if not exists public.cardapio_v2_qr_acessos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_cardapio_v2_qr_acessos_estabelecimento_data on public.cardapio_v2_qr_acessos(estabelecimento_id, created_at);

-- ══════════════════════════════════════════════════════════════════════
-- HELPERS DE RLS — cada tabela filha (categoria/item/variação) precisaria
-- repetir um join de 2-4 níveis até estabelecimentos em toda policy de
-- escrita. Em vez de copiar isso em ~15 lugares (e arriscar divergir),
-- uma cadeia de functions security definer, mesma técnica de
-- public.eh_funcionario_ativo (20260827c_corrigir_recursao_funcionarios.sql).
-- Sem revoke de PUBLIC de propósito: essas functions só devolvem um uuid
-- (não vazam dado sensível) e precisam ser executáveis pelo mesmo role
-- que a policy está avaliando (authenticated ou anon).
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.cardapio_v2_pode_gerenciar(p_estabelecimento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.estabelecimentos e
    where e.id = p_estabelecimento_id
      and (
        e.owner_user_id = auth.uid()
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
        or public.eh_funcionario_ativo(e.id, auth.uid())
      )
  )
$$;

create or replace function public.cardapio_v2_estabelecimento_do_cardapio(p_cardapio_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.estabelecimento_id from public.cardapio_v2_cardapios c where c.id = p_cardapio_id
$$;

create or replace function public.cardapio_v2_estabelecimento_da_categoria(p_categoria_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.cardapio_v2_estabelecimento_do_cardapio(cat.cardapio_id)
  from public.cardapio_v2_categorias cat
  where cat.id = p_categoria_id
$$;

create or replace function public.cardapio_v2_estabelecimento_do_item(p_item_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.cardapio_v2_estabelecimento_da_categoria(i.categoria_id)
  from public.cardapio_v2_itens i
  where i.id = p_item_id
$$;

create or replace function public.cardapio_v2_estabelecimento_da_variacao(p_variacao_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.cardapio_v2_estabelecimento_do_item(v.item_id)
  from public.cardapio_v2_variacoes v
  where v.id = p_variacao_id
$$;

create or replace function public.cardapio_v2_estabelecimento_do_grupo_complemento(p_grupo_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.estabelecimento_id from public.cardapio_v2_grupos_complemento g where g.id = p_grupo_id
$$;

-- ══════════════════════════════════════════════════════════════════════
-- RLS — cardápio é dado público (mesmo princípio já usado no V1: leitura
-- liberada pra todo mundo, escrita só dono/funcionário ativo/super_admin).
-- Select e escrita são policies separadas (não "for all") justamente pra
-- poder liberar select geral sem liberar escrita junto — mesmo padrão de
-- categorias_leitura_publica/categorias_escrita_dono em
-- 20260827_corrigir_rls_funcionarios_e_outras.sql.
-- ══════════════════════════════════════════════════════════════════════

alter table public.cardapio_v2_cardapios enable row level security;
alter table public.cardapio_v2_categorias enable row level security;
alter table public.cardapio_v2_itens enable row level security;
alter table public.cardapio_v2_variacoes enable row level security;
alter table public.cardapio_v2_item_precos enable row level security;
alter table public.cardapio_v2_variacao_precos enable row level security;
alter table public.cardapio_v2_grupos_complemento enable row level security;
alter table public.cardapio_v2_grupo_complemento_opcoes enable row level security;
alter table public.cardapio_v2_item_grupos_complemento enable row level security;
alter table public.cardapio_v2_regras_exibicao enable row level security;
alter table public.cardapio_v2_traducoes enable row level security;
alter table public.cardapio_v2_item_allergens enable row level security;
alter table public.cardapio_v2_item_tags enable row level security;
alter table public.cardapio_v2_qr_acessos enable row level security;

-- cardapio_v2_cardapios
create policy "cardapio_v2_cardapios_leitura_publica" on public.cardapio_v2_cardapios for select using (true);
create policy "cardapio_v2_cardapios_insercao_dono" on public.cardapio_v2_cardapios for insert with check (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_cardapios_atualizacao_dono" on public.cardapio_v2_cardapios for update using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_cardapios_exclusao_dono" on public.cardapio_v2_cardapios for delete using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));

-- cardapio_v2_categorias
create policy "cardapio_v2_categorias_leitura_publica" on public.cardapio_v2_categorias for select using (true);
create policy "cardapio_v2_categorias_insercao_dono" on public.cardapio_v2_categorias for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_cardapio(cardapio_id)));
create policy "cardapio_v2_categorias_atualizacao_dono" on public.cardapio_v2_categorias for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_cardapio(cardapio_id)));
create policy "cardapio_v2_categorias_exclusao_dono" on public.cardapio_v2_categorias for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_cardapio(cardapio_id)));

-- cardapio_v2_itens
create policy "cardapio_v2_itens_leitura_publica" on public.cardapio_v2_itens for select using (true);
create policy "cardapio_v2_itens_insercao_dono" on public.cardapio_v2_itens for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_categoria(categoria_id)));
create policy "cardapio_v2_itens_atualizacao_dono" on public.cardapio_v2_itens for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_categoria(categoria_id)));
create policy "cardapio_v2_itens_exclusao_dono" on public.cardapio_v2_itens for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_categoria(categoria_id)));

-- cardapio_v2_variacoes
create policy "cardapio_v2_variacoes_leitura_publica" on public.cardapio_v2_variacoes for select using (true);
create policy "cardapio_v2_variacoes_insercao_dono" on public.cardapio_v2_variacoes for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_variacoes_atualizacao_dono" on public.cardapio_v2_variacoes for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_variacoes_exclusao_dono" on public.cardapio_v2_variacoes for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));

-- cardapio_v2_item_precos
create policy "cardapio_v2_item_precos_leitura_publica" on public.cardapio_v2_item_precos for select using (true);
create policy "cardapio_v2_item_precos_insercao_dono" on public.cardapio_v2_item_precos for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_precos_atualizacao_dono" on public.cardapio_v2_item_precos for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_precos_exclusao_dono" on public.cardapio_v2_item_precos for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));

-- cardapio_v2_variacao_precos
create policy "cardapio_v2_variacao_precos_leitura_publica" on public.cardapio_v2_variacao_precos for select using (true);
create policy "cardapio_v2_variacao_precos_insercao_dono" on public.cardapio_v2_variacao_precos for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_variacao(variacao_id)));
create policy "cardapio_v2_variacao_precos_atualizacao_dono" on public.cardapio_v2_variacao_precos for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_variacao(variacao_id)));
create policy "cardapio_v2_variacao_precos_exclusao_dono" on public.cardapio_v2_variacao_precos for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_variacao(variacao_id)));

-- cardapio_v2_grupos_complemento
create policy "cardapio_v2_grupos_complemento_leitura_publica" on public.cardapio_v2_grupos_complemento for select using (true);
create policy "cardapio_v2_grupos_complemento_insercao_dono" on public.cardapio_v2_grupos_complemento for insert with check (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_grupos_complemento_atualizacao_dono" on public.cardapio_v2_grupos_complemento for update using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_grupos_complemento_exclusao_dono" on public.cardapio_v2_grupos_complemento for delete using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));

-- cardapio_v2_grupo_complemento_opcoes
create policy "cardapio_v2_grupo_complemento_opcoes_leitura_publica" on public.cardapio_v2_grupo_complemento_opcoes for select using (true);
create policy "cardapio_v2_grupo_complemento_opcoes_insercao_dono" on public.cardapio_v2_grupo_complemento_opcoes for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_grupo_complemento(grupo_id)));
create policy "cardapio_v2_grupo_complemento_opcoes_atualizacao_dono" on public.cardapio_v2_grupo_complemento_opcoes for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_grupo_complemento(grupo_id)));
create policy "cardapio_v2_grupo_complemento_opcoes_exclusao_dono" on public.cardapio_v2_grupo_complemento_opcoes for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_grupo_complemento(grupo_id)));

-- cardapio_v2_item_grupos_complemento
create policy "cardapio_v2_item_grupos_complemento_leitura_publica" on public.cardapio_v2_item_grupos_complemento for select using (true);
create policy "cardapio_v2_item_grupos_complemento_insercao_dono" on public.cardapio_v2_item_grupos_complemento for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_grupos_complemento_atualizacao_dono" on public.cardapio_v2_item_grupos_complemento for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_grupos_complemento_exclusao_dono" on public.cardapio_v2_item_grupos_complemento for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));

-- cardapio_v2_regras_exibicao
create policy "cardapio_v2_regras_exibicao_leitura_publica" on public.cardapio_v2_regras_exibicao for select using (true);
create policy "cardapio_v2_regras_exibicao_insercao_dono" on public.cardapio_v2_regras_exibicao for insert with check (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_regras_exibicao_atualizacao_dono" on public.cardapio_v2_regras_exibicao for update using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_regras_exibicao_exclusao_dono" on public.cardapio_v2_regras_exibicao for delete using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));

-- cardapio_v2_traducoes (item_id OU categoria_id, coalesce resolve os dois casos)
create policy "cardapio_v2_traducoes_leitura_publica" on public.cardapio_v2_traducoes for select using (true);
create policy "cardapio_v2_traducoes_insercao_dono" on public.cardapio_v2_traducoes for insert with check (
  public.cardapio_v2_pode_gerenciar(coalesce(public.cardapio_v2_estabelecimento_do_item(item_id), public.cardapio_v2_estabelecimento_da_categoria(categoria_id)))
);
create policy "cardapio_v2_traducoes_atualizacao_dono" on public.cardapio_v2_traducoes for update using (
  public.cardapio_v2_pode_gerenciar(coalesce(public.cardapio_v2_estabelecimento_do_item(item_id), public.cardapio_v2_estabelecimento_da_categoria(categoria_id)))
);
create policy "cardapio_v2_traducoes_exclusao_dono" on public.cardapio_v2_traducoes for delete using (
  public.cardapio_v2_pode_gerenciar(coalesce(public.cardapio_v2_estabelecimento_do_item(item_id), public.cardapio_v2_estabelecimento_da_categoria(categoria_id)))
);

-- cardapio_v2_item_allergens
create policy "cardapio_v2_item_allergens_leitura_publica" on public.cardapio_v2_item_allergens for select using (true);
create policy "cardapio_v2_item_allergens_insercao_dono" on public.cardapio_v2_item_allergens for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_allergens_exclusao_dono" on public.cardapio_v2_item_allergens for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));

-- cardapio_v2_item_tags
create policy "cardapio_v2_item_tags_leitura_publica" on public.cardapio_v2_item_tags for select using (true);
create policy "cardapio_v2_item_tags_insercao_dono" on public.cardapio_v2_item_tags for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));
create policy "cardapio_v2_item_tags_exclusao_dono" on public.cardapio_v2_item_tags for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_do_item(item_id)));

-- cardapio_v2_qr_acessos — insert público (é o próprio scan do QR, sem
-- sessão), select restrito (contagem é dado do dono, não pública)
create policy "cardapio_v2_qr_acessos_insercao_publica" on public.cardapio_v2_qr_acessos for insert to anon, authenticated with check (true);
create policy "cardapio_v2_qr_acessos_leitura_dono" on public.cardapio_v2_qr_acessos for select using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));

-- ══════════════════════════════════════════════════════════════════════
-- RPC transacional de salvamento — item + variações + vínculos de grupo
-- de complemento numa chamada só (resolve as "5 escritas soltas" do V1).
-- security definer ignora RLS, por isso a autorização é checada
-- manualmente logo no início, e cada id recebido é validado contra
-- p_estabelecimento_id antes de gravar (sem isso, alguém autenticado em
-- OUTRO estabelecimento poderia gravar linha usando categoria_id/grupo_id
-- de terceiros só porque o insert em si passaria despercebido).
-- ══════════════════════════════════════════════════════════════════════

create or replace function public.cardapio_v2_salvar_item(
  p_estabelecimento_id uuid,
  p_item jsonb,
  p_variacoes jsonb default '[]'::jsonb,
  p_complemento_grupo_ids jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_categoria_id uuid := (p_item->>'categoria_id')::uuid;
  v_variacao jsonb;
  v_grupo_id uuid;
begin
  if not public.cardapio_v2_pode_gerenciar(p_estabelecimento_id) then
    raise exception 'Sem permissão para editar o cardápio deste estabelecimento.';
  end if;

  if public.cardapio_v2_estabelecimento_da_categoria(v_categoria_id) is distinct from p_estabelecimento_id then
    raise exception 'Categoria não pertence a este estabelecimento.';
  end if;

  if (p_item->>'id') is not null then
    v_item_id := (p_item->>'id')::uuid;

    if public.cardapio_v2_estabelecimento_do_item(v_item_id) is distinct from p_estabelecimento_id then
      raise exception 'Item não pertence a este estabelecimento.';
    end if;

    update public.cardapio_v2_itens set
      categoria_id = v_categoria_id,
      nome = p_item->>'nome',
      descricao = p_item->>'descricao',
      foto_url = p_item->>'foto_url',
      preco_base = coalesce((p_item->>'preco_base')::numeric, 0),
      ordem = coalesce((p_item->>'ordem')::int, 0),
      ativo = coalesce((p_item->>'ativo')::boolean, true),
      updated_at = now()
    where id = v_item_id;
  else
    insert into public.cardapio_v2_itens (categoria_id, nome, descricao, foto_url, preco_base, ordem, ativo)
    values (
      v_categoria_id,
      p_item->>'nome',
      p_item->>'descricao',
      p_item->>'foto_url',
      coalesce((p_item->>'preco_base')::numeric, 0),
      coalesce((p_item->>'ordem')::int, 0),
      coalesce((p_item->>'ativo')::boolean, true)
    )
    returning id into v_item_id;
  end if;

  -- diff simples pra fase 1: apaga e regrava tudo. Volume por item é
  -- baixo (poucas variações/grupos cada), não é gargalo real.
  delete from public.cardapio_v2_variacoes where item_id = v_item_id;
  for v_variacao in select * from jsonb_array_elements(coalesce(p_variacoes, '[]'::jsonb))
  loop
    insert into public.cardapio_v2_variacoes (item_id, nome, preco, ordem)
    values (
      v_item_id,
      v_variacao->>'nome',
      (v_variacao->>'preco')::numeric,
      coalesce((v_variacao->>'ordem')::int, 0)
    );
  end loop;

  delete from public.cardapio_v2_item_grupos_complemento where item_id = v_item_id;
  for v_grupo_id in
    select elem::uuid from jsonb_array_elements_text(coalesce(p_complemento_grupo_ids, '[]'::jsonb)) as elem
  loop
    if public.cardapio_v2_estabelecimento_do_grupo_complemento(v_grupo_id) is distinct from p_estabelecimento_id then
      raise exception 'Grupo de complemento não pertence a este estabelecimento.';
    end if;

    insert into public.cardapio_v2_item_grupos_complemento (item_id, grupo_id)
    values (v_item_id, v_grupo_id);
  end loop;

  return v_item_id;
end;
$$;

-- Postgres concede EXECUTE a PUBLIC por padrão em toda function nova —
-- revogar explicitamente antes de conceder só a authenticated, mesmo
-- cuidado já documentado em 20260828b_revogar_execute_publico_rpc_cnpj.sql.
-- Esta RPC grava dado, diferente dos helpers de RLS acima que só leem.
revoke execute on function public.cardapio_v2_salvar_item(uuid, jsonb, jsonb, jsonb) from public;
revoke execute on function public.cardapio_v2_salvar_item(uuid, jsonb, jsonb, jsonb) from anon;
grant execute on function public.cardapio_v2_salvar_item(uuid, jsonb, jsonb, jsonb) to authenticated;
