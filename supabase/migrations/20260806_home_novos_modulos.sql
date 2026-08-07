-- Novos módulos ativáveis da home pública (mesmo padrão dos 5 já
-- existentes em configuracoes_home) — busca por texto livre, explorar
-- por bairro, categorias populares, recomendados (usa o campo `destaque`
-- que já existe em estabelecimentos) e o CTA reforçado pra donos.
alter table public.configuracoes_home
  add column if not exists busca_ativado boolean not null default true,
  add column if not exists explorar_bairro_ativado boolean not null default true,
  add column if not exists categorias_populares_ativado boolean not null default true,
  add column if not exists recomendados_ativado boolean not null default true,
  add column if not exists cta_donos_ativado boolean not null default true;
