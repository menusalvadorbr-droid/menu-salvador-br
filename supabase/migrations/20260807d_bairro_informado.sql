-- Texto original do bairro devolvido pela Receita Federal (BrasilAPI),
-- guardado mesmo quando não bate com nenhum bairro já cadastrado —
-- é o dado que permite ao admin geral cadastrar o bairro certo depois
-- (fila de pendências em /admin/estabelecimentos/pendencias) em vez de
-- perder a informação.
alter table public.estabelecimentos add column if not exists bairro_informado text;
