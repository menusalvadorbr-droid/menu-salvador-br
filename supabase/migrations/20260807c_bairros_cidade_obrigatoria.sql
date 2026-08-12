-- bairros.cidade_id ficou nullable na migração anterior (o alter table
-- veio antes do seed de cidades/bairros, não dava pra exigir not null
-- ainda sem valor nenhum pra preencher). Com o seed já aplicado (todos
-- os 15 bairros hoje têm cidade_id), torna obrigatório de verdade —
-- bairro sem cidade não devia existir: é exatamente a causa raiz do bug
-- de bairro de uma cidade sendo usado por estabelecimento de outra.
alter table public.bairros alter column cidade_id set not null;
