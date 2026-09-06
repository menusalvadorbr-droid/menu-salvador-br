import { createClient } from '@/lib/supabase/client'
import type { CampoTraduzivel, CardapioV2Traducao } from './types'

// error do supabase-js é um objeto plano (PostgrestError), não Error —
// lançar direto faz o overlay do Next mostrar "[object Object]" em vez da
// mensagem real. Mesmo padrão de estoqueRepository.ts.

export async function listarTraducoesDoItem(itemId: string): Promise<CardapioV2Traducao[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('cardapio_v2_traducoes').select('*').eq('item_id', itemId)
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Sempre grava com origem 'manual' — a origem 'ia' fica reservada pro
 * job de tradução automática que ainda não existe (ver podeUsar() em
 * permissoes.ts, gate 'cardapio_v2.traducao_ia'). */
export async function salvarTraducaoManual(itemId: string, idioma: string, campo: CampoTraduzivel, texto: string): Promise<void> {
  const supabase = createClient()
  const { error: erroExclusao } = await supabase.from('cardapio_v2_traducoes').delete().match({ item_id: itemId, idioma, campo })
  if (erroExclusao) throw new Error(erroExclusao.message)
  if (!texto.trim()) return
  const { error } = await supabase
    .from('cardapio_v2_traducoes')
    .insert({ item_id: itemId, idioma, campo, texto, origem: 'manual' })
  if (error) throw new Error(error.message)
}
