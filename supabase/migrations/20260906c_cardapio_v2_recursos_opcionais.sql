-- Cardápio V2 — alérgenos, observação nutricional e tags viravam sempre
-- visíveis no editor e na página pública, mesmo pra quem não quer usar.
-- Mesmo padrão que o V1 já usa pra recursos opcionais do cardápio
-- (cardapio_variacoes_ativado, cardapio_complementos_ativado em
-- estabelecimentos, ver 20260828_view_publica_estabelecimentos.sql):
-- flag por cardápio, desligada por padrão, dono ativa quando quiser.
alter table public.cardapio_v2_cardapios
  add column if not exists alergenos_ativado boolean not null default false,
  add column if not exists info_nutricional_ativado boolean not null default false,
  add column if not exists tags_ativado boolean not null default false,
  add column if not exists traducao_ativado boolean not null default false;

-- Sem mudança de RLS: as policies de cardapio_v2_cardapios já cobrem
-- select público / escrita dono-funcionário-admin pra qualquer coluna da
-- tabela, incluindo as novas.
