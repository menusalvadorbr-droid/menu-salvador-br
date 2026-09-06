import { createClient } from '@/lib/supabase/client'
import type { CardapioV2RegraExibicao, TipoRegraExibicao } from './types'

// error do supabase-js é um objeto plano (PostgrestError), não Error —
// lançar direto faz o overlay do Next mostrar "[object Object]" em vez da
// mensagem real. Mesmo padrão de estoqueRepository.ts.

export async function listarRegrasDoItem(itemId: string): Promise<CardapioV2RegraExibicao[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('cardapio_v2_regras_exibicao').select('*').eq('item_id', itemId)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function listarRegrasDaCategoria(categoriaId: string): Promise<CardapioV2RegraExibicao[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('cardapio_v2_regras_exibicao').select('*').eq('categoria_id', categoriaId)
  if (error) throw new Error(error.message)
  return data ?? []
}

export type RegraExibicaoInput = Omit<CardapioV2RegraExibicao, 'id' | 'created_at' | 'estabelecimento_id'>

/** Cada item tem no máximo 1 regra ativa por tipo nesta fase (sem
 * histórico de regras passadas) — substitui a regra existente do tipo em
 * vez de acumular, pra o editor não precisar de tela de "gerenciar
 * regras antigas". */
export async function definirRegra(
  estabelecimentoId: string,
  dono: { item_id: string } | { categoria_id: string },
  tipo: TipoRegraExibicao,
  dados: Partial<RegraExibicaoInput>
): Promise<void> {
  const supabase = createClient()
  const filtroDono = 'item_id' in dono ? { item_id: dono.item_id } : { categoria_id: dono.categoria_id }

  const { error: erroExclusao } = await supabase.from('cardapio_v2_regras_exibicao').delete().match({ ...filtroDono, tipo })
  if (erroExclusao) throw new Error(erroExclusao.message)

  const { error } = await supabase.from('cardapio_v2_regras_exibicao').insert({
    estabelecimento_id: estabelecimentoId,
    tipo,
    item_id: 'item_id' in dono ? dono.item_id : null,
    categoria_id: 'categoria_id' in dono ? dono.categoria_id : null,
    ativo: true,
    ...dados,
  })

  if (error) throw new Error(error.message)
}

export async function removerRegra(estabelecimentoId: string, dono: { item_id: string } | { categoria_id: string }, tipo: TipoRegraExibicao): Promise<void> {
  const supabase = createClient()
  const filtroDono = 'item_id' in dono ? { item_id: dono.item_id } : { categoria_id: dono.categoria_id }
  const { error } = await supabase
    .from('cardapio_v2_regras_exibicao')
    .delete()
    .match({ estabelecimento_id: estabelecimentoId, tipo, ...filtroDono })
  if (error) throw new Error(error.message)
}
