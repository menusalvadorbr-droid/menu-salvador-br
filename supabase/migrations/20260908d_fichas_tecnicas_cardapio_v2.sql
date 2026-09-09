-- Ficha técnica passa a vincular item do Cardápio V2, não mais V1. Coluna
-- aditiva de propósito — cardapio_item_id continua existindo e não é
-- tocada aqui, porque buildCardapioContext.ts (atendimento por IA no
-- WhatsApp) ainda lê ela pro V1, fora do escopo desta mudança (ver plano
-- "Módulo mesa/garçom lendo o Cardápio V2"). Quando o V1 for de fato
-- descomissionado, cardapio_item_id é removida numa migration própria.
alter table public.fichas_tecnicas
  add column if not exists cardapio_v2_item_id uuid references public.cardapio_v2_itens(id) on delete set null;

create index if not exists idx_fichas_tecnicas_cardapio_v2_item on public.fichas_tecnicas(cardapio_v2_item_id);
