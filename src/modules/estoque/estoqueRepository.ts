import { createClient } from '@/lib/supabase/client'
import type { Insumo, ItemReceita, UnidadeInsumo } from './types'

export async function listarItensCardapioSimples(estabelecimentoId: string) {
  const supabase = createClient()
  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('ativo', true)
    .single()

  if (!menu) return []

  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, itens_cardapio(id, nome)')
    .eq('menu_id', menu.id)
    .order('ordem', { ascending: true })

  return (categorias || []).flatMap((cat: any) =>
    (cat.itens_cardapio || []).map((item: any) => ({ id: item.id, nome: item.nome, categoria: cat.nome }))
  )
}

export async function listarInsumos(estabelecimentoId: string): Promise<Insumo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function criarInsumo(
  estabelecimentoId: string,
  nome: string,
  unidade: UnidadeInsumo,
  estoqueAtual: number,
  estoqueMinimo: number
) {
  const supabase = createClient()
  const { error } = await supabase.from('insumos').insert({
    estabelecimento_id: estabelecimentoId,
    nome,
    unidade,
    estoque_atual: estoqueAtual,
    estoque_minimo: estoqueMinimo,
  })
  if (error) throw new Error(error.message)
}

export async function ajustarEstoque(insumoId: string, novaQuantidade: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('insumos')
    .update({ estoque_atual: novaQuantidade, updated_at: new Date().toISOString() })
    .eq('id', insumoId)
  if (error) throw new Error(error.message)
}

export async function removerInsumo(insumoId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('insumos').delete().eq('id', insumoId)
  if (error) throw new Error(error.message)
}

export async function listarReceita(itemCardapioId: string): Promise<ItemReceita[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('receitas')
    .select('*, insumo:insumos(*)')
    .eq('item_cardapio_id', itemCardapioId)
  if (error) throw new Error(error.message)
  return (data || []) as ItemReceita[]
}

export async function salvarItemReceita(itemCardapioId: string, insumoId: string, quantidadeUsada: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('receitas')
    .upsert(
      { item_cardapio_id: itemCardapioId, insumo_id: insumoId, quantidade_usada: quantidadeUsada },
      { onConflict: 'item_cardapio_id,insumo_id' }
    )
  if (error) throw new Error(error.message)
}

export async function removerItemReceita(receitaId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('receitas').delete().eq('id', receitaId)
  if (error) throw new Error(error.message)
}

/**
 * Dá baixa automática no estoque quando um pedido entra em preparo.
 * Recebe uma lista simples (id do item do cardápio + quantidade pedida)
 * de propósito — o módulo de estoque não precisa conhecer o formato de
 * Pedido do módulo de pedidos, só "o que foi consumido".
 *
 * Não lança erro se um item não tiver receita cadastrada (nem todo
 * estabelecimento vai controlar estoque de tudo) — só ignora e segue.
 */
export async function baixarEstoquePorItens(itens: { itemCardapioId: string; quantidade: number }[]) {
  const supabase = createClient()

  for (const item of itens) {
    const { data: receita } = await supabase
      .from('receitas')
      .select('insumo_id, quantidade_usada')
      .eq('item_cardapio_id', item.itemCardapioId)

    if (!receita || receita.length === 0) continue

    for (const linha of receita) {
      const { data: insumo } = await supabase
        .from('insumos')
        .select('estoque_atual')
        .eq('id', linha.insumo_id)
        .single()

      if (!insumo) continue

      const novaQuantidade = Math.max(0, insumo.estoque_atual - linha.quantidade_usada * item.quantidade)

      await supabase
        .from('insumos')
        .update({ estoque_atual: novaQuantidade, updated_at: new Date().toISOString() })
        .eq('id', linha.insumo_id)
    }
  }
}
