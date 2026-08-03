-- Módulo de Ficha Técnica — substitui o par receitas/ReceitaEditor (ainda
-- sem dados reais em produção, confirmado com o dono antes de derrubar a
-- tabela). insumos já existe e está em uso (estoqueRepository.ts) — aqui só
-- ganha os campos de custo/validade que faltavam pra virar ficha técnica de
-- verdade.

-- ── insumos: campos novos ────────────────────────────────────────────────
alter table public.insumos
  add column if not exists custo_unitario numeric(10,4) not null default 0,
  add column if not exists validade_dias_alerta int;

-- ── alérgeno do insumo — reaproveita a tabela allergens já existente
-- (usada hoje por item_allergens), não cria uma lista paralela. ──────────
create table if not exists public.insumo_allergens (
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  primary key (insumo_id, allergen_id)
);

create index if not exists idx_insumo_allergens_insumo on public.insumo_allergens(insumo_id);

-- ── fichas_tecnicas ───────────────────────────────────────────────────────
-- rendimento_qtd/rendimento_unidade: NÃO estava no rascunho original, mas
-- sem isso o custo de uma sub-ficha usada em outra não tem como ser
-- diluído por unidade (uma ficha que rende 1000g de molho custando R$50
-- não pode custar R$50 pra quem usa só 200g dela — precisa da base de
-- rendimento pra dividir). Ficha usada direto como prato (não como
-- sub-ficha de ninguém) pode deixar rendimento_qtd em 1 (padrão), não
-- afeta o cálculo dela mesma.
create table if not exists public.fichas_tecnicas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  cardapio_item_id uuid unique references public.itens_cardapio(id) on delete set null,
  nome text not null,
  sku_plu text,
  categoria_venda text,
  tempo_preparo_min int,
  preco_venda numeric(10,2),
  cmv_alvo_percentual numeric(5,2) not null default 30,
  rendimento_qtd numeric(10,3) not null default 1,
  rendimento_unidade text not null default 'un' check (rendimento_unidade in ('un', 'kg', 'g', 'l', 'ml')),
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fichas_tecnicas_estabelecimento on public.fichas_tecnicas(estabelecimento_id);

-- ── ficha_tecnica_itens (composição) ─────────────────────────────────────
create table if not exists public.ficha_tecnica_itens (
  id uuid primary key default gen_random_uuid(),
  ficha_tecnica_id uuid not null references public.fichas_tecnicas(id) on delete cascade,
  tipo text not null check (tipo in ('insumo', 'sub_ficha')),
  insumo_id uuid references public.insumos(id) on delete restrict,
  sub_ficha_id uuid references public.fichas_tecnicas(id) on delete restrict,
  qtd_bruta numeric(10,3) not null,
  unidade text not null check (unidade in ('un', 'kg', 'g', 'l', 'ml')),
  fator_correcao numeric(6,3) not null default 1 check (fator_correcao > 0),
  ordem int not null default 0,
  check (
    (tipo = 'insumo' and insumo_id is not null and sub_ficha_id is null) or
    (tipo = 'sub_ficha' and sub_ficha_id is not null and insumo_id is null)
  )
);

create index if not exists idx_ficha_tecnica_itens_ficha on public.ficha_tecnica_itens(ficha_tecnica_id);
create index if not exists idx_ficha_tecnica_itens_sub_ficha on public.ficha_tecnica_itens(sub_ficha_id) where sub_ficha_id is not null;

-- Trigger anti-ciclo: impede que uma sub-ficha usada em ficha_tecnica_itens
-- inclua, direta ou indiretamente (em qualquer profundidade), a própria
-- ficha_tecnica_id sendo editada — sem isso o cálculo recursivo de custo
-- entraria em loop infinito.
create or replace function public.checar_ciclo_ficha_tecnica()
returns trigger as $$
declare
  ciclo boolean;
begin
  if new.tipo = 'sub_ficha' and new.sub_ficha_id is not null then
    if new.sub_ficha_id = new.ficha_tecnica_id then
      raise exception 'Uma ficha técnica não pode usar a si mesma como sub-ficha.';
    end if;

    with recursive descendentes as (
      select sub_ficha_id as ficha_id
      from public.ficha_tecnica_itens
      where ficha_tecnica_id = new.sub_ficha_id and tipo = 'sub_ficha' and sub_ficha_id is not null
      union
      select fti.sub_ficha_id
      from public.ficha_tecnica_itens fti
      join descendentes d on fti.ficha_tecnica_id = d.ficha_id
      where fti.tipo = 'sub_ficha' and fti.sub_ficha_id is not null
    )
    select exists (select 1 from descendentes where ficha_id = new.ficha_tecnica_id) into ciclo;

    if ciclo then
      raise exception 'Essa composição criaria um ciclo entre fichas técnicas (uma usaria a outra que já usa a primeira).';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_checar_ciclo_ficha_tecnica on public.ficha_tecnica_itens;
create trigger trg_checar_ciclo_ficha_tecnica
  before insert or update on public.ficha_tecnica_itens
  for each row execute function public.checar_ciclo_ficha_tecnica();

-- ── ficha_tecnica_passos (modo de preparo) ───────────────────────────────
create table if not exists public.ficha_tecnica_passos (
  id uuid primary key default gen_random_uuid(),
  ficha_tecnica_id uuid not null references public.fichas_tecnicas(id) on delete cascade,
  ordem int not null,
  descricao text not null
);

create index if not exists idx_ficha_tecnica_passos_ficha on public.ficha_tecnica_passos(ficha_tecnica_id);

-- ── RLS — mesmo padrão de caixa_movimentacoes/pagamentos_mesa: dono,
-- funcionário ativo do estabelecimento, ou super_admin. insumos já tem RLS
-- configurado em produção (não mexemos nela); as tabelas novas precisam.
alter table public.insumo_allergens enable row level security;
alter table public.fichas_tecnicas enable row level security;
alter table public.ficha_tecnica_itens enable row level security;
alter table public.ficha_tecnica_passos enable row level security;

drop policy if exists "acesso_insumo_allergens" on public.insumo_allergens;
create policy "acesso_insumo_allergens" on public.insumo_allergens
  for all using (
    exists (
      select 1 from public.insumos i
      join public.estabelecimentos e on e.id = i.estabelecimento_id
      where i.id = insumo_allergens.insumo_id
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

drop policy if exists "acesso_fichas_tecnicas" on public.fichas_tecnicas;
create policy "acesso_fichas_tecnicas" on public.fichas_tecnicas
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = fichas_tecnicas.estabelecimento_id
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

drop policy if exists "acesso_ficha_tecnica_itens" on public.ficha_tecnica_itens;
create policy "acesso_ficha_tecnica_itens" on public.ficha_tecnica_itens
  for all using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.estabelecimentos e on e.id = ft.estabelecimento_id
      where ft.id = ficha_tecnica_itens.ficha_tecnica_id
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

drop policy if exists "acesso_ficha_tecnica_passos" on public.ficha_tecnica_passos;
create policy "acesso_ficha_tecnica_passos" on public.ficha_tecnica_passos
  for all using (
    exists (
      select 1 from public.fichas_tecnicas ft
      join public.estabelecimentos e on e.id = ft.estabelecimento_id
      where ft.id = ficha_tecnica_passos.ficha_tecnica_id
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

-- ── Substitui receitas: projeto ainda em construção, sem dados reais em
-- produção (confirmado com o dono antes de rodar isto). O código já para
-- de usar essa tabela na mesma leva desta migration.
drop table if exists public.receitas cascade;
