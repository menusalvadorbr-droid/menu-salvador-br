-- Módulo de promoções unificado (ver plano "Módulo de promoções unificado
-- (Cardápio V2)") — combos/ofertas com contador em cima do Cardápio V2,
-- substituindo special_offers/special_offer_itens do V1.
--
-- Diferente do V1 (special_offers tinha suas próprias colunas de
-- agendamento — dias_semana/hora_inicio/hora_fim/inicio_em/fim_em/
-- exibir_inicio/exibir_fim — duplicando o que disponibilidade/promoção de
-- item já resolvem em cardapio_v2_regras_exibicao), aqui a oferta NÃO tem
-- coluna de agendamento nenhuma: "quando está ativa" é uma linha em
-- cardapio_v2_regras_exibicao (tipo='promocao'), com oferta_id como um
-- terceiro tipo de dono possível, ao lado de item_id/categoria_id. Mesmo
-- resolvedor (resolverEstadoExibicao/regraEstaNaJanela) atende item,
-- categoria e oferta — sem reimplementar o cálculo de janela uma segunda
-- vez. Sem regra vinculada = oferta sempre ativa, sem contador (mesma
-- convenção já usada por item/categoria sem regra de disponibilidade).
create table if not exists public.cardapio_v2_ofertas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  nome text not null,
  descricao text,
  foto_url text,
  preco_de numeric(10,2),
  preco_por numeric(10,2) not null,
  card_largo boolean not null default false,
  ativo boolean not null default true,
  -- A partir de quantos minutos antes do fim da janela o contador vira
  -- urgente (âmbar) na tela pública — não é agendamento, é só estilo.
  alerta_minutos int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cardapio_v2_ofertas_estabelecimento on public.cardapio_v2_ofertas(estabelecimento_id);

-- Composição opcional a partir de itens do cardápio (bill-of-materials do
-- combo) — mesmo papel de special_offer_itens; preço continua manual
-- (preco_de/preco_por acima), nunca somado automaticamente dos itens.
create table if not exists public.cardapio_v2_oferta_itens (
  id uuid primary key default gen_random_uuid(),
  oferta_id uuid not null references public.cardapio_v2_ofertas(id) on delete cascade,
  item_id uuid not null references public.cardapio_v2_itens(id) on delete cascade,
  quantidade numeric(10,2) not null default 1
);

create index if not exists idx_cardapio_v2_oferta_itens_oferta on public.cardapio_v2_oferta_itens(oferta_id);

-- Recurso opcional, mesmo padrão de alergenos_ativado/tags_ativado etc.
-- (20260906c_cardapio_v2_recursos_opcionais.sql) — equivalente ao
-- promocoes_contador_ativado do V1: liga só a seção de combos/contador;
-- promoção por item (cardapio_v2_regras_exibicao) continua sempre
-- disponível, sem depender deste toggle.
alter table public.cardapio_v2_cardapios
  add column if not exists ofertas_ativado boolean not null default false;

-- ── cardapio_v2_regras_exibicao passa a aceitar oferta_id como um
-- terceiro tipo de dono, ao lado de item_id/categoria_id ────────────────
alter table public.cardapio_v2_regras_exibicao
  add column if not exists oferta_id uuid references public.cardapio_v2_ofertas(id) on delete cascade;

create index if not exists idx_cardapio_v2_regras_exibicao_oferta on public.cardapio_v2_regras_exibicao(oferta_id) where oferta_id is not null;

-- Troca o check "exatamente item OU categoria" por "exatamente um dos
-- três" — via loop dinâmico (não dá pra confiar no nome autogerado do
-- constraint antigo), mesmo padrão já usado em
-- 20260828_view_publica_estabelecimentos.sql pra dropar policy sem saber
-- o nome de antemão.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.cardapio_v2_regras_exibicao'::regclass and contype = 'c'
  loop
    execute format('alter table public.cardapio_v2_regras_exibicao drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.cardapio_v2_regras_exibicao
  add constraint cardapio_v2_regras_exibicao_dono_check check (
    (item_id is not null)::int + (categoria_id is not null)::int + (oferta_id is not null)::int = 1
  );

alter table public.cardapio_v2_ofertas enable row level security;
alter table public.cardapio_v2_oferta_itens enable row level security;

create or replace function public.cardapio_v2_estabelecimento_da_oferta(p_oferta_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select o.estabelecimento_id from public.cardapio_v2_ofertas o where o.id = p_oferta_id
$$;

create policy "cardapio_v2_ofertas_leitura_publica" on public.cardapio_v2_ofertas for select using (true);
create policy "cardapio_v2_ofertas_insercao_dono" on public.cardapio_v2_ofertas for insert with check (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_ofertas_atualizacao_dono" on public.cardapio_v2_ofertas for update using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));
create policy "cardapio_v2_ofertas_exclusao_dono" on public.cardapio_v2_ofertas for delete using (public.cardapio_v2_pode_gerenciar(estabelecimento_id));

create policy "cardapio_v2_oferta_itens_leitura_publica" on public.cardapio_v2_oferta_itens for select using (true);
create policy "cardapio_v2_oferta_itens_insercao_dono" on public.cardapio_v2_oferta_itens for insert with check (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_oferta(oferta_id)));
create policy "cardapio_v2_oferta_itens_atualizacao_dono" on public.cardapio_v2_oferta_itens for update using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_oferta(oferta_id)));
create policy "cardapio_v2_oferta_itens_exclusao_dono" on public.cardapio_v2_oferta_itens for delete using (public.cardapio_v2_pode_gerenciar(public.cardapio_v2_estabelecimento_da_oferta(oferta_id)));
