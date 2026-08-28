-- Redesenho da tela de acompanhamento do pedido: o resumo financeiro
-- separa subtotal/desconto/acréscimo do total (já em destaque no
-- cabeçalho). Desconto existe em `orders` mas nunca foi replicado pro
-- espelho público — precisa entrar aqui. Não é dado sensível (só um
-- valor, mesma lógica já documentada pras outras colunas desta tabela).
alter table public.pedidos_acompanhamento add column if not exists desconto numeric;

create or replace function public.sincronizar_pedido_acompanhamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pedidos_acompanhamento (
    id, estabelecimento_id, items, total, tipo_pedido, mesa, status,
    metodo_pagamento, desconto, created_at, approved_at, ready_at, delivered_at, updated_at
  )
  values (
    new.id, new.estabelecimento_id, new.items, new.total, new.tipo_pedido, new.mesa, new.status,
    new.metodo_pagamento, new.desconto, new.created_at, new.approved_at, new.ready_at, new.delivered_at, now()
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
