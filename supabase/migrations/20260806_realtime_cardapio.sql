-- Habilita Realtime (postgres_changes) em itens_cardapio e categorias —
-- necessário pro cardápio público atualizar em tempo real durante a
-- visita (INSERT/UPDATE/DELETE), sem precisar ficar checando de novo.
-- Sem isso, o supabase-js se inscreve normalmente mas nunca recebe
-- nenhum evento.
alter publication supabase_realtime add table public.itens_cardapio;
alter publication supabase_realtime add table public.categorias;
