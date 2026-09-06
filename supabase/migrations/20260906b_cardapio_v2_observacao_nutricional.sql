-- Cardápio V2 — coluna que ficou faltando da lista de funcionalidades do
-- doc (cardapio-v2-visao.md): "Alérgenos e observação nutricional" — só
-- alérgenos tinha sido modelado na migração 20260906. Texto livre (ex:
-- "contém 450 kcal por porção"), sem estrutura fixa — o doc não pede
-- campos nutricionais numéricos, só uma observação.
alter table public.cardapio_v2_itens add column if not exists observacao_nutricional text;

-- RPC transacional precisa aceitar o campo novo pra continuar sendo o
-- único ponto de escrita do item (mesmo motivo de existir a RPC: uma
-- chamada só, não uma escrita solta a mais toda vez que este campo muda).
create or replace function public.cardapio_v2_salvar_item(
  p_estabelecimento_id uuid,
  p_item jsonb,
  p_variacoes jsonb default '[]'::jsonb,
  p_complemento_grupo_ids jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_categoria_id uuid := (p_item->>'categoria_id')::uuid;
  v_variacao jsonb;
  v_grupo_id uuid;
begin
  if not public.cardapio_v2_pode_gerenciar(p_estabelecimento_id) then
    raise exception 'Sem permissão para editar o cardápio deste estabelecimento.';
  end if;

  if public.cardapio_v2_estabelecimento_da_categoria(v_categoria_id) is distinct from p_estabelecimento_id then
    raise exception 'Categoria não pertence a este estabelecimento.';
  end if;

  if (p_item->>'id') is not null then
    v_item_id := (p_item->>'id')::uuid;

    if public.cardapio_v2_estabelecimento_do_item(v_item_id) is distinct from p_estabelecimento_id then
      raise exception 'Item não pertence a este estabelecimento.';
    end if;

    update public.cardapio_v2_itens set
      categoria_id = v_categoria_id,
      nome = p_item->>'nome',
      descricao = p_item->>'descricao',
      foto_url = p_item->>'foto_url',
      preco_base = coalesce((p_item->>'preco_base')::numeric, 0),
      ordem = coalesce((p_item->>'ordem')::int, 0),
      ativo = coalesce((p_item->>'ativo')::boolean, true),
      observacao_nutricional = p_item->>'observacao_nutricional',
      updated_at = now()
    where id = v_item_id;
  else
    insert into public.cardapio_v2_itens (categoria_id, nome, descricao, foto_url, preco_base, ordem, ativo, observacao_nutricional)
    values (
      v_categoria_id,
      p_item->>'nome',
      p_item->>'descricao',
      p_item->>'foto_url',
      coalesce((p_item->>'preco_base')::numeric, 0),
      coalesce((p_item->>'ordem')::int, 0),
      coalesce((p_item->>'ativo')::boolean, true),
      p_item->>'observacao_nutricional'
    )
    returning id into v_item_id;
  end if;

  delete from public.cardapio_v2_variacoes where item_id = v_item_id;
  for v_variacao in select * from jsonb_array_elements(coalesce(p_variacoes, '[]'::jsonb))
  loop
    insert into public.cardapio_v2_variacoes (item_id, nome, preco, ordem)
    values (
      v_item_id,
      v_variacao->>'nome',
      (v_variacao->>'preco')::numeric,
      coalesce((v_variacao->>'ordem')::int, 0)
    );
  end loop;

  delete from public.cardapio_v2_item_grupos_complemento where item_id = v_item_id;
  for v_grupo_id in
    select elem::uuid from jsonb_array_elements_text(coalesce(p_complemento_grupo_ids, '[]'::jsonb)) as elem
  loop
    if public.cardapio_v2_estabelecimento_do_grupo_complemento(v_grupo_id) is distinct from p_estabelecimento_id then
      raise exception 'Grupo de complemento não pertence a este estabelecimento.';
    end if;

    insert into public.cardapio_v2_item_grupos_complemento (item_id, grupo_id)
    values (v_item_id, v_grupo_id);
  end loop;

  return v_item_id;
end;
$$;

-- create or replace preserva GRANT/REVOKE já aplicados na migração
-- anterior (Postgres não reseta privilégios ao trocar o corpo da
-- function) — nada a repetir aqui.
