import { createClient } from '@/lib/supabase/client'
import type { CardapioV2Categoria } from './types'

export async function listarCategorias(cardapioId: string): Promise<CardapioV2Categoria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_categorias')
    .select('*')
    .eq('cardapio_id', cardapioId)
    .order('ordem', { ascending: true })

  // error do supabase-js é um objeto plano (PostgrestError), não Error —
  // lançar direto faz o overlay do Next mostrar "[object Object]" em vez
  // da mensagem real. Mesmo padrão de estoqueRepository.ts.
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function criarCategoria(cardapioId: string, nome: string): Promise<CardapioV2Categoria> {
  const supabase = createClient()
  const { data: existentes, error: erroBusca } = await supabase
    .from('cardapio_v2_categorias')
    .select('ordem')
    .eq('cardapio_id', cardapioId)
    .order('ordem', { ascending: false })
    .limit(1)

  if (erroBusca) throw new Error(erroBusca.message)

  const proximaOrdem = (existentes?.[0]?.ordem ?? -1) + 1

  const { data, error } = await supabase
    .from('cardapio_v2_categorias')
    .insert({ cardapio_id: cardapioId, nome, ordem: proximaOrdem })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Falha ao criar categoria')
  return data
}

export async function atualizarCategoria(id: string, dados: Partial<Pick<CardapioV2Categoria, 'nome' | 'ativo'>>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_categorias').update(dados).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function excluirCategoria(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_categorias').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Troca a ordem entre duas categorias adjacentes (botões subir/descer). */
export async function reordenarCategorias(a: { id: string; ordem: number }, b: { id: string; ordem: number }): Promise<void> {
  const supabase = createClient()
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('cardapio_v2_categorias').update({ ordem: b.ordem }).eq('id', a.id),
    supabase.from('cardapio_v2_categorias').update({ ordem: a.ordem }).eq('id', b.id),
  ])
  const erro = e1 ?? e2
  if (erro) throw new Error(erro.message)
}
