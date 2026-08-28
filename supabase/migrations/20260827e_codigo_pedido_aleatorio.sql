-- Pré-requisito: a primeira tentativa desta migration travou porque o
-- backfill do código tocava em pedidos órfãos (orders.estabelecimento_id
-- nulo — 11 linhas de teste manual de 22/06, semanas antes do primeiro
-- pedido real, sem nenhum vínculo com outra tabela), e o UPDATE disparava
-- o trigger sincronizar_pedido_acompanhamento(), que quebra ao tentar
-- inserir estabelecimento_id nulo numa coluna not null em
-- pedidos_acompanhamento. Os 11 órfãos já foram excluídos separadamente
-- (confirmado com o dono antes de apagar). Trava a coluna como not null
-- pra esse tipo de dado nunca mais conseguir entrar, nem por teste manual
-- direto no banco.
alter table public.orders alter column estabelecimento_id set not null;

-- Código curto do pedido deixa de ser derivado do id (id.slice(0,8), uma
-- fatia do uuid, sem checagem de unicidade nenhuma) e passa a ser um
-- código de verdade: 6 caracteres sorteados aleatoriamente, sem nenhuma
-- relação com canal/data/turno/sequência de criação — qualquer estrutura
-- embutida reduziria o espaço de combinação e permitiria chute (ex: golpista
-- sabendo "é hoje, é delivery" já reduz bastante o que precisa adivinhar).
-- Alfabeto exclui caracteres visualmente confundíveis (I, L, O, 0).
alter table public.orders add column if not exists codigo_pedido text;

create or replace function public.gerar_codigo_pedido_aleatorio()
returns text
language plpgsql
as $$
declare
  alfabeto text := 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
  candidato text;
  tentativas int := 0;
begin
  loop
    candidato := '';
    for i in 1..6 loop
      candidato := candidato || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    tentativas := tentativas + 1;
    exit when not exists (select 1 from public.orders where codigo_pedido = candidato);
    if tentativas > 20 then
      raise exception 'Não foi possível gerar código único do pedido após % tentativas', tentativas;
    end if;
  end loop;
  return candidato;
end;
$$;

-- Backfill dos pedidos já existentes (inclusive Pix pendentes agora mesmo,
-- que precisam do código pra continuar funcionando).
do $$
declare
  r record;
begin
  for r in select id from public.orders where codigo_pedido is null loop
    update public.orders set codigo_pedido = public.gerar_codigo_pedido_aleatorio() where id = r.id;
  end loop;
end $$;

alter table public.orders alter column codigo_pedido set not null;
create unique index if not exists orders_codigo_pedido_key on public.orders (codigo_pedido);

-- Gera sozinho em todo insert daqui pra frente (cobre checkout do cliente,
-- lançamento pelo garçom e sincronização de contingência — todos passam
-- por `orders`, um trigger só cobre tudo sem precisar tocar em cada
-- caminho de código que insere pedido).
create or replace function public.trg_gerar_codigo_pedido()
returns trigger
language plpgsql
as $$
begin
  if new.codigo_pedido is null then
    new.codigo_pedido := public.gerar_codigo_pedido_aleatorio();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gerar_codigo_pedido on public.orders;
create trigger trg_gerar_codigo_pedido
  before insert on public.orders
  for each row execute function public.trg_gerar_codigo_pedido();

-- Espelho público (pedidos_acompanhamento) precisa do código também — é
-- ele quem a tela de acompanhamento do cliente lê.
alter table public.pedidos_acompanhamento add column if not exists codigo_pedido text;

update public.pedidos_acompanhamento pa
set codigo_pedido = o.codigo_pedido
from public.orders o
where pa.id = o.id and pa.codigo_pedido is null;

alter table public.pedidos_acompanhamento alter column codigo_pedido set not null;

create or replace function public.sincronizar_pedido_acompanhamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pedidos_acompanhamento (
    id, estabelecimento_id, items, total, tipo_pedido, mesa, status,
    metodo_pagamento, desconto, codigo_pedido, created_at, approved_at, ready_at, delivered_at, updated_at
  )
  values (
    new.id, new.estabelecimento_id, new.items, new.total, new.tipo_pedido, new.mesa, new.status,
    new.metodo_pagamento, new.desconto, new.codigo_pedido, new.created_at, new.approved_at, new.ready_at, new.delivered_at, now()
  )
  on conflict (id) do update set
    status = excluded.status,
    total = excluded.total,
    metodo_pagamento = excluded.metodo_pagamento,
    desconto = excluded.desconto,
    approved_at = excluded.approved_at,
    ready_at = excluded.ready_at,
    delivered_at = excluded.delivered_at,
    updated_at = now();
  return new;
end;
$$;
