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
