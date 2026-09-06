import { createClient } from '@/lib/supabase/client'
import type { CardapioV2ItemCompleto, CardapioV2ItemInput, CardapioV2RegraExibicao, CardapioV2VariacaoInput } from './types'
import { SELECT_ITEM_CARDAPIO_V2_COMPLETO, agruparRegrasPorDono, itemBrutoParaCompleto, type ItemBrutoComRelacoes } from './shapeCardapio'

// error do supabase-js é um objeto plano (PostgrestError), não uma
// instância de Error — lançar ele direto faz o overlay do Next (e
// qualquer try/catch que espera .message) mostrar "[object Object]" em
// vez da mensagem real. Toda função abaixo envolve em new Error(...),
// mesmo padrão já usado em estoqueRepository.ts.

/** Lista todos os itens (ativos e inativos — o editor precisa ver e poder
 * reativar itens desligados) das categorias informadas, já no formato
 * completo usado pelo preview e pelos formulários. */
export async function listarItensCompletos(categoriaIds: string[]): Promise<CardapioV2ItemCompleto[]> {
  if (categoriaIds.length === 0) return []
  const supabase = createClient()

  const { data: itensBrutos, error: itensErro } = await supabase
    .from('cardapio_v2_itens')
    .select(SELECT_ITEM_CARDAPIO_V2_COMPLETO)
    .in('categoria_id', categoriaIds)
    .order('ordem', { ascending: true })
  if (itensErro) throw new Error(itensErro.message)

  const itens = (itensBrutos ?? []) as unknown as ItemBrutoComRelacoes[]
  const itemIds = itens.map((i) => i.id)

  // Regras de categoria (disponibilidade/promoção/destaque no nível da
  // categoria inteira) são lidas à parte por regrasExibicaoRepository —
  // aqui só as regras por item, usadas no preview/lista do editor.
  const { data: regrasDosItens, error: regrasItensErro } = itemIds.length
    ? await supabase.from('cardapio_v2_regras_exibicao').select('*').in('item_id', itemIds)
    : { data: [] as CardapioV2RegraExibicao[], error: null }
  if (regrasItensErro) throw new Error(regrasItensErro.message)

  const { porItem } = agruparRegrasPorDono((regrasDosItens ?? []) as CardapioV2RegraExibicao[])

  return itens.map((item) => itemBrutoParaCompleto(item, porItem.get(item.id) ?? []))
}

/** Salva item + variações + vínculos de grupo de complemento numa
 * transação só, via RPC (ver cardapio_v2_salvar_item na migração
 * 20260906_cardapio_v2_schema.sql) — substitui as "5 escritas soltas" do V1. */
export async function salvarItem(
  estabelecimentoId: string,
  item: CardapioV2ItemInput,
  variacoes: CardapioV2VariacaoInput[],
  complementoGrupoIds: string[]
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('cardapio_v2_salvar_item', {
    p_estabelecimento_id: estabelecimentoId,
    p_item: item,
    p_variacoes: variacoes,
    p_complemento_grupo_ids: complementoGrupoIds,
  })

  if (error) throw new Error(error.message)
  return data as string
}

export async function alternarAtivoItem(itemId: string, ativo: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_itens').update({ ativo }).eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function excluirItem(itemId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_itens').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

/** Troca a ordem entre dois itens adjacentes (botões subir/descer — sem
 * drag-and-drop na fase 3, ver decisão em cardapio-v2-visao.md). */
export async function reordenarItens(a: { id: string; ordem: number }, b: { id: string; ordem: number }): Promise<void> {
  const supabase = createClient()
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('cardapio_v2_itens').update({ ordem: b.ordem }).eq('id', a.id),
    supabase.from('cardapio_v2_itens').update({ ordem: a.ordem }).eq('id', b.id),
  ])
  const erro = e1 ?? e2
  if (erro) throw new Error(erro.message)
}

export async function atualizarAlergenosDoItem(itemId: string, allergenIds: string[]): Promise<void> {
  const supabase = createClient()
  const { error: delErro } = await supabase.from('cardapio_v2_item_allergens').delete().eq('item_id', itemId)
  if (delErro) throw new Error(delErro.message)
  if (allergenIds.length === 0) return
  const { error: insErro } = await supabase
    .from('cardapio_v2_item_allergens')
    .insert(allergenIds.map((allergen_id) => ({ item_id: itemId, allergen_id })))
  if (insErro) throw new Error(insErro.message)
}

export async function atualizarTagsDoItem(itemId: string, tags: string[]): Promise<void> {
  const supabase = createClient()
  const { error: delErro } = await supabase.from('cardapio_v2_item_tags').delete().eq('item_id', itemId)
  if (delErro) throw new Error(delErro.message)
  if (tags.length === 0) return
  const { error: insErro } = await supabase.from('cardapio_v2_item_tags').insert(tags.map((tag) => ({ item_id: itemId, tag })))
  if (insErro) throw new Error(insErro.message)
}
