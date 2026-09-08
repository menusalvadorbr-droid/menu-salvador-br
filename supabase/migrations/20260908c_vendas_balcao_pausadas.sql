-- "Pausar venda" no Caixa (Nova venda / balcão) — inspirado no mockup
-- caixa-venda-balcao-mockup(2).html, mas persistido no banco em vez de só
-- memória do navegador: um operador que atende 2+ clientes ao mesmo tempo
-- no balcão precisa guardar um carrinho em andamento sem perdê-lo se a
-- aba recarregar ou o dispositivo travar no meio do turno.
--
-- Preso à sessão de caixa (não só ao estabelecimento): pausar uma venda
-- só faz sentido dentro do turno corrente — on delete cascade em
-- caixa_sessoes garante que vendas pausadas de um turno já fechado somem
-- junto (elas não deveriam sobreviver pro turno seguinte).
create table if not exists public.vendas_balcao_pausadas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  caixa_sessao_id uuid not null references public.caixa_sessoes(id) on delete cascade,
  nome_cliente text,
  -- Array de ItemPedido (src/modules/pedidos/types.ts) — mesmo shape já
  -- serializado em orders.items, reaproveitado aqui sem tabela própria por
  -- item já que essas linhas são temporárias (minutos até serem retomadas
  -- ou descartadas, não histórico permanente).
  itens jsonb not null,
  tipo_desconto text not null default 'valor' check (tipo_desconto in ('valor', 'percentual')),
  desconto_input text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_vendas_balcao_pausadas_sessao on public.vendas_balcao_pausadas(caixa_sessao_id);
create index if not exists idx_vendas_balcao_pausadas_estabelecimento on public.vendas_balcao_pausadas(estabelecimento_id);

alter table public.vendas_balcao_pausadas enable row level security;

-- Mesmo padrão de caixa_movimentacoes/pagamentos_mesa (dono, funcionário
-- ativo, ou super_admin do estabelecimento).
create policy "acesso_vendas_balcao_pausadas" on public.vendas_balcao_pausadas
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = vendas_balcao_pausadas.estabelecimento_id
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
