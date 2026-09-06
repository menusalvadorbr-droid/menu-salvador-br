import type { CanalCardapioV2, CardapioV2ItemCompleto, CardapioV2RegraExibicao } from './types'

export interface ItemBrutoComRelacoes {
  id: string
  categoria_id: string
  nome: string
  descricao: string | null
  foto_url: string | null
  observacao_nutricional: string | null
  preco_base: number
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
  cardapio_v2_variacoes: { id: string; item_id: string; nome: string; preco: number; ordem: number }[]
  cardapio_v2_item_precos: { id: string; canal: CanalCardapioV2; preco: number }[]
  cardapio_v2_item_grupos_complemento: { grupo_id: string }[]
  cardapio_v2_item_allergens: { allergen_id: string }[]
  cardapio_v2_item_tags: { tag: string }[]
}

/** Select comum entre a leitura pública e a leitura do editor — mesma
 * forma de dado nos dois lugares, só muda o filtro (ativo=true na
 * pública, tudo no editor). */
export const SELECT_ITEM_CARDAPIO_V2_COMPLETO =
  '*, cardapio_v2_variacoes(*), cardapio_v2_item_precos(id, canal, preco), cardapio_v2_item_grupos_complemento(grupo_id), cardapio_v2_item_allergens(allergen_id), cardapio_v2_item_tags(tag)'

export function agruparRegrasPorDono(regras: CardapioV2RegraExibicao[]) {
  const porItem = new Map<string, CardapioV2RegraExibicao[]>()
  const porCategoria = new Map<string, CardapioV2RegraExibicao[]>()
  for (const regra of regras) {
    if (regra.item_id) {
      porItem.set(regra.item_id, [...(porItem.get(regra.item_id) ?? []), regra])
    } else if (regra.categoria_id) {
      porCategoria.set(regra.categoria_id, [...(porCategoria.get(regra.categoria_id) ?? []), regra])
    }
  }
  return { porItem, porCategoria }
}

export function itemBrutoParaCompleto(item: ItemBrutoComRelacoes, regras: CardapioV2RegraExibicao[]): CardapioV2ItemCompleto {
  return {
    id: item.id,
    categoria_id: item.categoria_id,
    nome: item.nome,
    descricao: item.descricao,
    foto_url: item.foto_url,
    observacao_nutricional: item.observacao_nutricional,
    preco_base: item.preco_base,
    ordem: item.ordem,
    ativo: item.ativo,
    created_at: item.created_at,
    updated_at: item.updated_at,
    variacoes: [...item.cardapio_v2_variacoes].sort((a, b) => a.ordem - b.ordem),
    precos_canal: item.cardapio_v2_item_precos,
    grupos_complemento_ids: item.cardapio_v2_item_grupos_complemento.map((g) => g.grupo_id),
    alergeno_ids: item.cardapio_v2_item_allergens.map((a) => a.allergen_id),
    tags: item.cardapio_v2_item_tags.map((t) => t.tag),
    regras,
  }
}
