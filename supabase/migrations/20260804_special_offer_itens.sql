-- Combos de verdade: uma "promoção com contador" (special_offers) pode
-- opcionalmente ser composta por itens já cadastrados no cardápio, em vez
-- de só nome/preço/foto digitados livremente. Preço do combo continua
-- manual (special_offers.preco_por) — não é somado automaticamente.
create table if not exists public.special_offer_itens (
  id uuid primary key default gen_random_uuid(),
  special_offer_id uuid not null references public.special_offers(id) on delete cascade,
  -- cascade: excluir um item do cardápio só remove ele do combo (a promoção
  -- em si continua existindo) — sem isso, deletarItem() em CardapioTab.tsx
  -- (que ignora erro do delete()) falharia silenciosamente por violação de
  -- FK sempre que o item excluído fizesse parte de algum combo.
  item_cardapio_id uuid not null references public.itens_cardapio(id) on delete cascade,
  quantidade numeric(10,2) not null default 1
);

create index if not exists idx_special_offer_itens_offer on public.special_offer_itens(special_offer_id);

alter table public.special_offer_itens enable row level security;

-- Mesmo padrão já usado em todo o projeto (ex: ficha_tecnica_itens,
-- caixa_movimentacoes): dono, funcionário ativo do estabelecimento, ou
-- super_admin — aqui chegando em estabelecimento_id via special_offers.
drop policy if exists "acesso_special_offer_itens" on public.special_offer_itens;
create policy "acesso_special_offer_itens" on public.special_offer_itens
  for all using (
    exists (
      select 1 from public.special_offers so
      join public.estabelecimentos e on e.id = so.estabelecimento_id
      where so.id = special_offer_itens.special_offer_id
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
