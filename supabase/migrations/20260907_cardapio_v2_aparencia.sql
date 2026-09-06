-- Cardápio V2 — Fase 6 (aparência): cores, fonte, capa, título e layout,
-- editáveis diretamente pelo dono (sem catálogo de temas curado por
-- admin como o V1 tem — decisão deliberada de manter simples, ver
-- cardapio-v2-visao.md). `fonte` guarda o `nome` exato de
-- src/lib/fontesTema.ts (ex: 'Inter', 'Playfair Display') — utilitário
-- genérico reaproveitado como está, sem lógica de domínio do cardápio.
alter table public.cardapio_v2_cardapios
  add column if not exists cor_primaria text not null default '#EA580C',
  add column if not exists cor_fundo text not null default '#F9FAFB',
  add column if not exists cor_texto text not null default '#1F2937',
  add column if not exists fonte text not null default 'Inter',
  add column if not exists capa_url text,
  add column if not exists titulo_exibicao text,
  add column if not exists formato_exibicao text not null default 'lista'
    check (formato_exibicao in ('lista', 'catalogo')),
  add column if not exists foto_item_posicao text not null default 'left'
    check (foto_item_posicao in ('left', 'right', 'top', 'none'));

-- Sem mudança de RLS: as policies de cardapio_v2_cardapios já cobrem
-- select público / escrita dono-funcionário-admin pra qualquer coluna da
-- tabela, incluindo as novas (mesmo raciocínio da migração
-- 20260906c_cardapio_v2_recursos_opcionais.sql).
