'use server'

import { createClient } from '@/lib/supabase/server'
import { SELECT_ITEM_CARDAPIO_PUBLICO } from '@/lib/resolverItemCardapio'
import type { ItemCardapioBruto } from '@/lib/resolverItemCardapio'
import type { CategoriaCache } from '@/lib/cardapioCache'

async function buscarMenuId(estabelecimentoId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: true })
    .limit(1)
  return data?.[0]?.id ?? null
}

export interface ReferenciaCardapio {
  menuId: string | null
  categorias: CategoriaCache[]
  itensRef: { id: string; categoria_id: string; updated_at: string }[]
}

/**
 * Checagem leve de entrada — id+updated_at de TODAS as categorias
 * (já com os dados completos, a tabela é pequena) e um id+updated_at por
 * item (sem foto/descrição/joins, isso sim pesaria numa checagem que
 * roda em toda entrada no cardápio). Comparado contra o cache local pra
 * decidir o que buscar de verdade — ver useCardapioPublico.ts.
 */
export async function buscarReferenciaCardapio(estabelecimentoId: string): Promise<ReferenciaCardapio> {
  const menuId = await buscarMenuId(estabelecimentoId)
  if (!menuId) return { menuId: null, categorias: [], itensRef: [] }

  const supabase = await createClient()
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, ordem, foto_url, updated_at')
    .eq('menu_id', menuId)
    .order('ordem')

  const catIds = (categorias || []).map((c) => c.id)
  if (catIds.length === 0) return { menuId, categorias: categorias || [], itensRef: [] }

  const { data: itensRef } = await supabase
    .from('itens_cardapio')
    .select('id, categoria_id, updated_at')
    .in('categoria_id', catIds)
    .eq('disponivel', true)

  return { menuId, categorias: categorias || [], itensRef: itensRef || [] }
}

/**
 * Busca os dados completos (com joins de alérgenos/variações/grupos) só
 * dos itens passados — usado na reconciliação, tanto na checagem de
 * entrada quanto num evento de Realtime, pra nunca precisar rebuscar uma
 * categoria inteira por causa de UM item que mudou. Item pedido que não
 * volta na resposta (id não existe mais OU ficou indisponível) é tratado
 * pelo chamador como "remover do cache" — os dois casos têm o mesmo
 * efeito prático no cardápio público.
 */
export async function buscarItensPorIds(ids: string[]): Promise<ItemCardapioBruto[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itens_cardapio')
    .select(SELECT_ITEM_CARDAPIO_PUBLICO)
    .in('id', ids)
    .eq('disponivel', true)

  if (error) return []
  return (data || []) as unknown as ItemCardapioBruto[]
}

/**
 * Primeira carga (cache vazio) — categorias + itens de TODAS elas de uma
 * vez, pra semear o cache local. Mesma forma final que o modo Pílulas já
 * monta hoje no servidor; reaproveitada aqui pro cliente poder popular o
 * cache sozinho quando ele ainda não existe (ex: primeira visita em
 * Faixas/Cards, que não chegam com tudo pronto no HTML inicial).
 */
export async function buscarCardapioInicial(estabelecimentoId: string): Promise<{
  menuId: string | null
  categorias: CategoriaCache[]
  itensPorCategoria: Record<string, ItemCardapioBruto[]>
}> {
  const menuId = await buscarMenuId(estabelecimentoId)
  if (!menuId) return { menuId: null, categorias: [], itensPorCategoria: {} }

  const supabase = await createClient()
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, ordem, foto_url, updated_at')
    .eq('menu_id', menuId)
    .order('ordem')

  const catIds = (categorias || []).map((c) => c.id)
  if (catIds.length === 0) return { menuId, categorias: categorias || [], itensPorCategoria: {} }

  const { data: itens, error } = await supabase
    .from('itens_cardapio')
    .select(SELECT_ITEM_CARDAPIO_PUBLICO)
    .in('categoria_id', catIds)
    .eq('disponivel', true)
    .order('ordem')

  const itensPorCategoria: Record<string, ItemCardapioBruto[]> = {}
  if (!error) {
    for (const item of (itens || []) as unknown as ItemCardapioBruto[]) {
      if (!itensPorCategoria[item.categoria_id]) itensPorCategoria[item.categoria_id] = []
      itensPorCategoria[item.categoria_id].push(item)
    }
  }

  return { menuId, categorias: categorias || [], itensPorCategoria }
}
