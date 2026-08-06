'use server'

import { createClient } from '@/lib/supabase/server'
import { SELECT_ITEM_CARDAPIO_PUBLICO } from '@/lib/resolverItemCardapio'

/**
 * Busca os itens de UMA categoria só — usado por useCardapioPublico
 * (garantirCategoria) pra carregar uma categoria nunca vista antes, e
 * direto pela página de categoria (Cards). Faixas e Cards carregam uma
 * categoria por vez em vez do cardápio inteiro; Pílulas continua
 * chegando com tudo de uma vez (buscarCardapioInicial).
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
