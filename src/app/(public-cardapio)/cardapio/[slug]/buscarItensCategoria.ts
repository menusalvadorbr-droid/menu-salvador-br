'use server'

import { createClient } from '@/lib/supabase/server'
import { SELECT_ITEM_CARDAPIO_PUBLICO } from '@/lib/resolverItemCardapio'

/**
 * Busca os itens de UMA categoria só — usado pelas faixas expansíveis
 * (FaixasCategorias.tsx), que carregam uma categoria por vez, só quando
 * o visitante abre aquela faixa, em vez do cardápio inteiro de uma vez
 * (que é o que a navegação em pílulas ainda faz, sem mudança).
 */
export async function buscarItensCategoriaPublica(categoriaId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itens_cardapio')
    .select(SELECT_ITEM_CARDAPIO_PUBLICO)
    .eq('categoria_id', categoriaId)
    .eq('disponivel', true)
    .order('ordem')

  if (error) return []
  return data || []
}

/**
 * Checagem leve de "algo mudou desde a última vez" pro cache das faixas
 * expansíveis (FaixasCategorias.tsx) — uma linha só (updated_at do item
 * mais recentemente alterado entre TODAS as categorias do cardápio), não
 * o cardápio inteiro. Inclui itens indisponíveis de propósito: um item
 * sumir/reaparecer do cardápio (toggle de "disponível") também precisa
 * invalidar o cache, não só edição de nome/preço/foto.
 */
export async function buscarUltimaAtualizacaoCardapio(categoriaIds: string[]): Promise<string | null> {
  if (categoriaIds.length === 0) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itens_cardapio')
    .select('updated_at')
    .in('categoria_id', categoriaIds)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return data[0].updated_at
}
