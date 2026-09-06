import { createClient } from '@/lib/supabase/client'
import type { CardapioV2GrupoComplemento, CardapioV2GrupoComplementoOpcao } from './types'

export interface GrupoComplementoComOpcoes extends CardapioV2GrupoComplemento {
  opcoes: CardapioV2GrupoComplementoOpcao[]
}

export async function listarGruposComplemento(estabelecimentoId: string): Promise<GrupoComplementoComOpcoes[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_grupos_complemento')
    .select('*, cardapio_v2_grupo_complemento_opcoes(*)')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: true })

  // error do supabase-js é um objeto plano (PostgrestError), não Error —
  // lançar direto faz o overlay do Next mostrar "[object Object]" em vez
  // da mensagem real. Mesmo padrão de estoqueRepository.ts.
  if (error) throw new Error(error.message)

  return (data ?? []).map((g) => ({
    ...g,
    opcoes: (g.cardapio_v2_grupo_complemento_opcoes ?? []).sort(
      (a: CardapioV2GrupoComplementoOpcao, b: CardapioV2GrupoComplementoOpcao) => a.ordem - b.ordem
    ),
  }))
}

export async function criarGrupoComplemento(
  estabelecimentoId: string,
  dados: { nome: string; minimo: number; maximo: number }
): Promise<CardapioV2GrupoComplemento> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_grupos_complemento')
    .insert({ estabelecimento_id: estabelecimentoId, ...dados })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Falha ao criar grupo de complemento')
  return data
}

export async function atualizarGrupoComplemento(
  id: string,
  dados: Partial<{ nome: string; minimo: number; maximo: number }>
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_grupos_complemento').update(dados).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function excluirGrupoComplemento(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_grupos_complemento').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function criarOpcaoComplemento(
  grupoId: string,
  dados: { nome: string; preco_adicional: number; ordem?: number }
): Promise<CardapioV2GrupoComplementoOpcao> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_grupo_complemento_opcoes')
    .insert({ grupo_id: grupoId, ...dados })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Falha ao criar opção de complemento')
  return data
}

export async function excluirOpcaoComplemento(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_grupo_complemento_opcoes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
