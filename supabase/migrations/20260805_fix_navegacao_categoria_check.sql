-- estabelecimentos_cardapio_navegacao_categoria_check bloqueava o valor
-- 'cards' (navegação por categoria em cards com foto, adicionada nesta
-- sessão) — a constraint existente só conhecia 'pilulas'/'faixas', então
-- salvar em Configurações → Tema falhava com "violates check constraint".
alter table public.estabelecimentos
  drop constraint if exists estabelecimentos_cardapio_navegacao_categoria_check;

alter table public.estabelecimentos
  add constraint estabelecimentos_cardapio_navegacao_categoria_check
  check (cardapio_navegacao_categoria in ('pilulas', 'faixas', 'cards'));
