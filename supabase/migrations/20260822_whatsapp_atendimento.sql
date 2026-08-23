-- Robô de atendimento no WhatsApp (Cloud API da Meta) — fase 1, só tira
-- dúvida de cardápio (mesmas 4 regras do AI Waiter em src/lib/aiWaiter/).
-- Pedido pelo WhatsApp fica pra fase 2.

-- ── Mapeamento número Meta → estabelecimento ────────────────────────────
-- Não existe slug de URL no WhatsApp — o phone_number_id da Cloud API é a
-- única forma de saber qual loja recebeu a mensagem. Fase de teste pode
-- ter só uma linha aqui (um número compartilhado); "1 número por
-- restaurante" vs "número compartilhado" é decisão comercial futura, o
-- schema já suporta os dois (múltiplas linhas apontando pra
-- estabelecimentos diferentes).
create table if not exists public.whatsapp_numero_estabelecimento (
  id uuid primary key default gen_random_uuid(),
  phone_number_id text not null unique,
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_numero_estabelecimento_estab
  on public.whatsapp_numero_estabelecimento(estabelecimento_id);

-- ── Conversas ─────────────────────────────────────────────────────────
-- Uma linha por (telefone, estabelecimento) — histórico completo da
-- conversa em mensagens (mesmo formato {role, content} do AiWaiterChat.tsx,
-- + timestamp e, quando vem do cliente, o wamid pra checagem de
-- idempotência — a Meta reenvia notificação se não receber 200 rápido).
create table if not exists public.whatsapp_conversas (
  id uuid primary key default gen_random_uuid(),
  telefone text not null,
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  mensagens jsonb not null default '[]'::jsonb,
  precisa_humano boolean not null default false,
  ultima_interacao_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_whatsapp_conversas_telefone_estab
  on public.whatsapp_conversas(telefone, estabelecimento_id);
create index if not exists idx_whatsapp_conversas_estab_humano
  on public.whatsapp_conversas(estabelecimento_id, precisa_humano) where precisa_humano = true;

-- ── Log de métricas ───────────────────────────────────────────────────
-- Uma linha por mensagem do cliente processada — separado de
-- whatsapp_conversas (que guarda só o texto) pra dar pra somar
-- atalho-vs-IA e custo real sem parsear jsonb toda vez. resolvido_por
-- 'auditoria' é a chamada extra ao Haiku numa amostra pequena das
-- conversas (~5%), rodada em paralelo só pra registro de qualidade — não
-- é ela que responde ao cliente.
create table if not exists public.whatsapp_metricas_log (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos(id) on delete cascade,
  resolvido_por text not null check (resolvido_por in ('atalho', 'ia', 'auditoria')),
  modelo text,
  tokens_entrada int,
  tokens_saida int,
  criado_em timestamptz not null default now()
);

create index if not exists idx_whatsapp_metricas_log_estab_data
  on public.whatsapp_metricas_log(estabelecimento_id, criado_em);

-- ── Campos novos em estabelecimentos ─────────────────────────────────
alter table public.estabelecimentos
  add column if not exists whatsapp_robo_ativado boolean not null default false,
  add column if not exists whatsapp_status text not null default 'nao_conectado'
    check (whatsapp_status in ('nao_conectado', 'conectado', 'erro')),
  add column if not exists whatsapp_phone_number_id text,
  add column if not exists whatsapp_access_token text,
  -- Atalhos editáveis (gatilho → resposta fixa) além dos automáticos
  -- (horário e endereço, que puxam de horarios_funcionamento/endereco em
  -- vez de guardar duplicado aqui — ver src/lib/aiWaiter/atalhos.ts).
  add column if not exists whatsapp_atalhos jsonb not null default '[]'::jsonb;

-- ── RLS — mesmo padrão já usado no projeto inteiro (ficha_tecnica_itens,
-- caixa_movimentacoes, special_offer_itens): dono, funcionário ativo do
-- estabelecimento, ou super_admin. ────────────────────────────────────
alter table public.whatsapp_numero_estabelecimento enable row level security;
alter table public.whatsapp_conversas enable row level security;
alter table public.whatsapp_metricas_log enable row level security;

drop policy if exists "acesso_whatsapp_numero_estabelecimento" on public.whatsapp_numero_estabelecimento;
create policy "acesso_whatsapp_numero_estabelecimento" on public.whatsapp_numero_estabelecimento
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = whatsapp_numero_estabelecimento.estabelecimento_id
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

drop policy if exists "acesso_whatsapp_conversas" on public.whatsapp_conversas;
create policy "acesso_whatsapp_conversas" on public.whatsapp_conversas
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = whatsapp_conversas.estabelecimento_id
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

drop policy if exists "acesso_whatsapp_metricas_log" on public.whatsapp_metricas_log;
create policy "acesso_whatsapp_metricas_log" on public.whatsapp_metricas_log
  for all using (
    exists (
      select 1 from public.estabelecimentos e
      where e.id = whatsapp_metricas_log.estabelecimento_id
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

-- Webhook e processamento rodam com a service role (server-only, nunca
-- expostos ao navegador) — passam por cima do RLS normalmente, então não
-- precisam de policy própria além das de leitura/escrita do painel acima.
