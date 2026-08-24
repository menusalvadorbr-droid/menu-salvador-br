-- Movimento de estoque (Etapa 2) e ponto de reposição (Etapa 3), em cima
-- do cadastro de insumo e Ficha Técnica já existentes.

-- ── Campos novos em insumos ──────────────────────────────────────────
-- local_armazenamento é texto livre (o dono define, tipo "Freezer 1"),
-- usado mais adiante na contagem física (Etapa 4, ainda não implementada).
-- estoque_maximo e prazo_entrega_dias alimentam o cálculo do ponto de
-- reposição abaixo — nullable de propósito, insumo existente sem esses
-- campos preenchidos cai no fallback (ver comentário na fórmula).
alter table public.insumos
  add column if not exists local_armazenamento text,
  add column if not exists estoque_maximo numeric,
  add column if not exists prazo_entrega_dias numeric;

-- ── Movimento de estoque ──────────────────────────────────────────────
-- 'saida_venda' é gravado automaticamente por baixarEstoquePorItens
-- (src/modules/estoque/estoqueRepository.ts) a cada baixa por pedido —
-- não é lançado manualmente. Os outros 5 tipos vêm do formulário em
-- MovimentosManager.tsx. quantidade é sempre positiva; o sinal do efeito
-- em insumos.estoque_atual é decidido pelo tipo (soma pra entrada, subtrai
-- pros demais), não pelo valor.
create table if not exists public.movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  insumo_id uuid not null references public.insumos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida_manual', 'saida_venda', 'perda', 'cortesia', 'ajuste_inventario')),
  quantidade numeric not null check (quantidade > 0),
  motivo text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint motivo_obrigatorio_para_perda_cortesia_ajuste check (
    tipo not in ('perda', 'cortesia', 'ajuste_inventario') or motivo is not null
  )
);

create index if not exists idx_movimentos_estoque_estabelecimento on public.movimentos_estoque(estabelecimento_id);
-- Sustenta a consulta de consumo médio (soma de saídas dos últimos 30
-- dias por insumo) usada no cálculo do ponto de reposição.
create index if not exists idx_movimentos_estoque_insumo_data on public.movimentos_estoque(insumo_id, created_at);

alter table public.movimentos_estoque enable row level security;

-- Mesmo padrão usado em caixa_movimentacoes — sem restrição por cargo,
-- qualquer funcionário vinculado e ativo pode lançar movimento; a
-- rastreabilidade fica só no registro de quem fez, via criado_por.
create policy "acesso_movimentos_estoque" on public.movimentos_estoque
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = movimentos_estoque.estabelecimento_id
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

-- Necessário pro supabase-js receber os eventos via postgres_changes (mesmo
-- requisito de insumos, já habilitado em produção fora das migrations
-- rastreadas).
alter publication supabase_realtime add table public.movimentos_estoque;
