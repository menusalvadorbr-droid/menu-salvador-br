-- Fila do Operador: reúne 3 pendências hoje espalhadas/inexistentes —
-- conversas de IA escaladas (whatsapp_conversas.precisa_humano, já
-- existente), confirmação manual de Pix (derivada de orders, sem coluna
-- nova) e validação de pedido de entrega antes da cozinha (tabela nova
-- abaixo).

-- Telefone do cliente em orders — não existia campo nenhum pra isso
-- (checkout nunca coletou). Necessário pro botão "Falar no WhatsApp" e pra
-- detectar "cliente conhecido". Sem not null: pedidos já existentes e
-- pedidos lançados pelo garçom (mesa/balcão) continuam sem telefone, o que
-- é aceitável.
alter table public.orders add column if not exists telefone text;

create index if not exists idx_orders_estab_telefone
  on public.orders(estabelecimento_id, telefone)
  where telefone is not null;

-- pedido_id referencia orders (a tabela real por trás do que o time chama
-- de "pedidos" em conversa) — não existe tabela public.pedidos.
create table if not exists public.validacao_pedidos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.orders(id) on delete cascade,
  -- Denormalizado de orders.estabelecimento_id de propósito: o filtro do
  -- Supabase Realtime (postgres_changes) só aceita igualdade numa coluna
  -- própria da tabela, não um join — sem isso o canal teria que ouvir a
  -- tabela inteira sem filtro (evento de qualquer estabelecimento do
  -- sistema disparando refetch em todo mundo). Preenchido sozinho pela
  -- trigger abaixo, nenhuma tela grava aqui direto.
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado')),
  motivo_recusa text,
  validado_por uuid references public.profiles(id),
  validado_em timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_validacao_pedidos_pedido
  on public.validacao_pedidos(pedido_id);

create index if not exists idx_validacao_pedidos_estab_pendente
  on public.validacao_pedidos(estabelecimento_id, status)
  where status = 'pendente';

-- Cria a linha de validação automaticamente a partir de orders — mesmo
-- princípio de sincronizar_pedido_acompanhamento() em
-- 20260823_pedidos_acompanhamento.sql. Cobre os 2 únicos pontos de INSERT
-- em orders (criarPedido e sincronizarPendentes, ambos em
-- ordersRepository.ts) sem precisar tocar em nenhum dos dois, e cobre
-- qualquer origem futura de pedido de entrega sem precisar lembrar de
-- atualizar essa regra em mais um lugar. Pedidos de entrega criados antes
-- desta migration não têm linha aqui e por isso nunca ficam bloqueados no
-- board de comandas — efeito colateral intencional, não deve travar pedido
-- histórico em produção.
create or replace function public.criar_validacao_pedido_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.validacao_pedidos (pedido_id, estabelecimento_id, status)
  values (new.id, new.estabelecimento_id, 'pendente')
  on conflict (pedido_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_criar_validacao_pedido_entrega on public.orders;
create trigger trg_criar_validacao_pedido_entrega
  after insert on public.orders
  for each row
  when (new.tipo_pedido = 'entrega')
  execute function public.criar_validacao_pedido_entrega();

alter table public.validacao_pedidos enable row level security;

-- Mesmo padrão inline de 3 vias já usado em whatsapp_conversas
-- (20260822_whatsapp_atendimento.sql) e movimentos_estoque
-- (20260824_movimentos_estoque.sql): dono, super_admin, ou funcionário
-- ativo do estabelecimento. Sem gate por cargo — nenhuma tabela do projeto
-- restringe por função de funcionário, só por ativo=true.
drop policy if exists "acesso_validacao_pedidos" on public.validacao_pedidos;
create policy "acesso_validacao_pedidos" on public.validacao_pedidos
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = validacao_pedidos.estabelecimento_id
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

-- Necessário pro supabase-js receber eventos via postgres_changes (mesmo
-- requisito já documentado em 20260806_realtime_cardapio.sql e
-- 20260825_realtime_whatsapp_conversas.sql — sem isto a inscrição é aceita
-- normalmente mas nenhum evento chega, sem erro nenhum). orders e
-- whatsapp_conversas já estão na publicação, não precisam de linha nova.
alter publication supabase_realtime add table public.validacao_pedidos;
