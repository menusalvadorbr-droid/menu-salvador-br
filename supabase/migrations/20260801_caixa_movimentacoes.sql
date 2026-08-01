-- Sangrias (retirada) e suprimentos (reforço) de dinheiro na gaveta do
-- caixa, lançados manualmente durante o turno. Alimenta o cálculo do
-- "valor esperado" no fechamento da sessão (ver caixaRepository.ts).
create table if not exists public.caixa_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  caixa_sessao_id uuid not null references public.caixa_sessoes(id) on delete cascade,
  tipo text not null check (tipo in ('sangria', 'suprimento')),
  valor numeric(10,2) not null check (valor > 0),
  motivo text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_caixa_movimentacoes_sessao on public.caixa_movimentacoes(caixa_sessao_id);
create index if not exists idx_caixa_movimentacoes_estabelecimento on public.caixa_movimentacoes(estabelecimento_id);

alter table public.caixa_movimentacoes enable row level security;

-- Mesmo padrão usado em pagamentos_mesa (dono, funcionário ativo, ou
-- super_admin do estabelecimento) — sem policy nenhuma, RLS ligado nega
-- acesso a todo mundo, inclusive o dono.
create policy "acesso_caixa_movimentacoes" on public.caixa_movimentacoes
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = caixa_movimentacoes.estabelecimento_id
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
