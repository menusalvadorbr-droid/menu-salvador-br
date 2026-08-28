-- Geração de código Pix (BR Code) pros pedidos: chave Pix do estabelecimento,
-- configurável pelo dono em Configurações, usada pra montar o payload EMV
-- (nome_fantasia + cidade + valor do pedido + txid) na tela pública de
-- acompanhamento do pedido.
alter table public.estabelecimentos add column if not exists chave_pix text;
alter table public.estabelecimentos add column if not exists tipo_chave_pix text;
-- tipo_chave_pix é só metadado de UX (placeholder/rótulo no formulário de
-- Configurações) — a geração do BR Code usa chave_pix crua, não valida o
-- formato contra o tipo declarado.

-- pedidos_acompanhamento (espelho público, ver 20260823_pedidos_acompanhamento.sql)
-- precisa saber a forma de pagamento pra decidir se mostra o painel de Pix
-- na tela do cliente. Não é dado sensível (só "Pix"/"Dinheiro"/etc, não
-- identifica ninguém) — mesma lógica já usada pras outras colunas ali.
alter table public.pedidos_acompanhamento add column if not exists metodo_pagamento text;

create or replace function public.sincronizar_pedido_acompanhamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pedidos_acompanhamento (
    id, estabelecimento_id, items, total, tipo_pedido, mesa, status,
    metodo_pagamento, created_at, approved_at, ready_at, delivered_at, updated_at
  )
  values (
    new.id, new.estabelecimento_id, new.items, new.total, new.tipo_pedido, new.mesa, new.status,
    new.metodo_pagamento, new.created_at, new.approved_at, new.ready_at, new.delivered_at, now()
  )
  on conflict (id) do update set
    status = excluded.status,
    total = excluded.total,
    metodo_pagamento = excluded.metodo_pagamento,
    approved_at = excluded.approved_at,
    ready_at = excluded.ready_at,
    delivered_at = excluded.delivered_at,
    updated_at = now();
  return new;
end;
$$;
