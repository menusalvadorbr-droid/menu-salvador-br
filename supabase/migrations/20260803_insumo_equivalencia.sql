-- Equivalência de unidade do insumo — resolve o caso "compro em unidade,
-- receita usa peso/volume" (1 ovo = 50 g, 1 lata de óleo = 900 ml). Sem
-- isso, uma ficha técnica não tem como converter com segurança entre a
-- unidade em que o insumo tem custo/estoque cadastrado e a unidade que a
-- receita realmente usa. kg↔g e l↔ml não precisam disso (conversão métrica
-- universal, feita direto no código); isso aqui só cobre a travessia
-- unidade↔peso/volume, que é específica de cada produto.
alter table public.insumos
  add column if not exists equivalencia_qtd numeric(10,3),
  add column if not exists equivalencia_unidade text check (equivalencia_unidade in ('un', 'kg', 'g', 'l', 'ml'));
