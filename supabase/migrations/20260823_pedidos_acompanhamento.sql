-- Acompanhamento público do pedido pelo cliente (link pós-checkout) — a
-- tabela `orders` guarda dados sensíveis (nome_cliente, endereco_entrega,
-- metodo_pagamento) e sua RLS é fechada pra equipe autenticada só, então
-- não dá pra abrir SELECT anônimo nela sem vazar dado de outros clientes
-- (RLS é por linha, não por coluna nem por filtro da consulta — uma policy
-- `using (true)` deixaria qualquer um listar a tabela orders inteira, não
-- só o pedido do link que a pessoa tem). Solução: espelho público, mantido
-- por trigger, só com o que a tela de acompanhamento realmente precisa —
-- nenhum dado sensível é replicado aqui.
create table if not exists public.pedidos_acompanhamento (
  id uuid primary key references public.orders(id) on delete cascade,
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  items jsonb not null,
  total numeric not null,
  tipo_pedido text not null,
  mesa text,
  status text not null,
  created_at timestamptz not null,
  approved_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_pedidos_acompanhamento_estab
  on public.pedidos_acompanhamento(estabelecimento_id);

alter table public.pedidos_acompanhamento enable row level security;

-- id é um uuid aleatório (equivale a um link de acesso) e as colunas aqui
-- não incluem nada sensível — leitura pública igual à do cardápio.
drop policy if exists "leitura_publica_pedidos_acompanhamento" on public.pedidos_acompanhamento;
create policy "leitura_publica_pedidos_acompanhamento" on public.pedidos_acompanhamento
  for select using (true);

-- Sincronizado automaticamente a partir de `orders` — nenhuma tela grava
-- aqui diretamente, então o fluxo de criar/atualizar pedido (ordersRepository.ts)
-- não precisa mudar nada.
create or replace function public.sincronizar_pedido_acompanhamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pedidos_acompanhamento (
    id, estabelecimento_id, items, total, tipo_pedido, mesa, status,
    created_at, approved_at, ready_at, delivered_at, updated_at
  )
  values (
    new.id, new.estabelecimento_id, new.items, new.total, new.tipo_pedido, new.mesa, new.status,
    new.created_at, new.approved_at, new.ready_at, new.delivered_at, now()
  )
  on conflict (id) do update set
    status = excluded.status,
    total = excluded.total,
    approved_at = excluded.approved_at,
    ready_at = excluded.ready_at,
    delivered_at = excluded.delivered_at,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sincronizar_pedido_acompanhamento on public.orders;
create trigger trg_sincronizar_pedido_acompanhamento
  after insert or update on public.orders
  for each row execute function public.sincronizar_pedido_acompanhamento();

-- Necessário pro supabase-js receber os eventos via postgres_changes (ver
-- 20260806_realtime_cardapio.sql, mesmo requisito) — sem isto a inscrição
-- é aceita mas nenhum evento chega.
alter publication supabase_realtime add table public.pedidos_acompanhamento;
