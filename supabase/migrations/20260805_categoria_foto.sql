-- Foto representativa por categoria — usada pela navegação por categoria
-- em cards (grid de cards retangulares antes da lista de itens no
-- cardápio público). Opcional: sem foto, o card cai num ícone padrão.
alter table public.categorias add column if not exists foto_url text;
