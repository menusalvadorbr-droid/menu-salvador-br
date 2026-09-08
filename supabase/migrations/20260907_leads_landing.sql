-- Leads capturados na landing page de divulgação (projeto separado,
-- menu-salvador-landing, deploy próprio na Vercel) — grava no mesmo
-- Supabase deste projeto pra centralizar o dado, sem acoplar os dois
-- códigos. Diferente de cardapio_v2_qr_acessos (só um contador, sem
-- dado sensível), aqui tem nome/whatsapp — por isso o insert é público
-- mas a leitura fica restrita ao super_admin, não "using (true)".
create table if not exists public.leads_landing (
  id uuid primary key default gen_random_uuid(),
  nome_estabelecimento text not null,
  nome_responsavel text,
  whatsapp text not null,
  -- Opcional de propósito — só o WhatsApp é contato garantido no
  -- formulário (campo required lá), e-mail é um extra pra quem preferir.
  email text,
  cidade text,
  bairro text,
  observacao text,
  -- Cai sempre 'landing' hoje (única origem que grava aqui), mas guarda o
  -- caminho aberto pra distinguir campanhas/páginas diferentes no futuro
  -- sem precisar de migração nova.
  origem text not null default 'landing',
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_landing_created_at on public.leads_landing(created_at desc);

alter table public.leads_landing enable row level security;

-- Mesmo padrão de cardapio_v2_qr_acessos_insercao_publica: formulário sem
-- login, insert liberado pra anon/authenticated.
drop policy if exists "leads_landing_insercao_publica" on public.leads_landing;
create policy "leads_landing_insercao_publica" on public.leads_landing
  for insert
  to anon, authenticated
  with check (true);

-- Leitura só pro super_admin (é dado de contato de gente de fora da
-- plataforma ainda, sem estabelecimento pra checar contra owner_user_id).
drop policy if exists "leads_landing_leitura_super_admin" on public.leads_landing;
create policy "leads_landing_leitura_super_admin" on public.leads_landing
  for select
  to authenticated
  using (is_super_admin());
