import { createClient } from '@/lib/supabase/client'
import type { CardapioV2RegraExibicao, TipoRegraExibicao } from './types'

// error do supabase-js é um objeto plano (PostgrestError), não Error —
// lançar direto faz o overlay do Next mostrar "[object Object]" em vez da
// mensagem real. Mesmo padrão de estoqueRepository.ts.

export type DonoRegra = { item_id: string } | { categoria_id: string } | { oferta_id: string }

function filtroDono(dono: DonoRegra) {
  if ('item_id' in dono) return { item_id: dono.item_id }
  if ('categoria_id' in dono) return { categoria_id: dono.categoria_id }
  return { oferta_id: dono.oferta_id }
}

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

/** Uma oferta tem no máximo 1 regra (tipo='promocao', a janela em que o
 *  combo fica ativo) — sem regra vinculada, a oferta fica sempre ativa,
 *  sem contador. */
export async function listarRegraDaOferta(ofertaId: string): Promise<CardapioV2RegraExibicao | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_regras_exibicao')
    .select('*')
    .eq('oferta_id', ofertaId)
    .eq('tipo', 'promocao')
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export type RegraExibicaoInput = Omit<CardapioV2RegraExibicao, 'id' | 'created_at' | 'estabelecimento_id'>

/** Cada dono (item, categoria ou oferta) tem no máximo 1 regra ativa por
 * tipo nesta fase (sem histórico de regras passadas) — substitui a regra
 * existente do tipo em vez de acumular, pro editor não precisar de tela
 * de "gerenciar regras antigas". */
export async function definirRegra(
  estabelecimentoId: string,
  dono: DonoRegra,
  tipo: TipoRegraExibicao,
  dados: Partial<RegraExibicaoInput>
): Promise<void> {
  const supabase = createClient()
  const filtro = filtroDono(dono)

  const { error: erroExclusao } = await supabase.from('cardapio_v2_regras_exibicao').delete().match({ ...filtro, tipo })
  if (erroExclusao) throw new Error(erroExclusao.message)

  const { error } = await supabase.from('cardapio_v2_regras_exibicao').insert({
    estabelecimento_id: estabelecimentoId,
    tipo,
    item_id: 'item_id' in dono ? dono.item_id : null,
    categoria_id: 'categoria_id' in dono ? dono.categoria_id : null,
    oferta_id: 'oferta_id' in dono ? dono.oferta_id : null,
    ativo: true,
    ...dados,
  })

  if (error) throw new Error(error.message)
}

export async function removerRegra(estabelecimentoId: string, dono: DonoRegra, tipo: TipoRegraExibicao): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('cardapio_v2_regras_exibicao')
    .delete()
    .match({ estabelecimento_id: estabelecimentoId, tipo, ...filtroDono(dono) })
  if (error) throw new Error(error.message)
}
