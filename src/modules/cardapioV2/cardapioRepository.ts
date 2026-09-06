import { createClient } from '@/lib/supabase/client'
import type { AparenciaCardapio, CardapioV2Cardapio, CanalPadraoCardapioV2, RecursosOpcionaisCardapio } from './types'

/**
 * O editor sempre trabalha em cima de 1 cardápio (o doc prevê múltiplos —
 * presencial/delivery distintos — mas a fase 3 cobre o caso simples de um
 * só, marcado 'ambos'). Se o estabelecimento ainda não tem nenhum, cria na
 * hora — evita uma tela extra de "criar seu primeiro cardápio".
 */
export async function obterOuCriarCardapioPadrao(estabelecimentoId: string): Promise<CardapioV2Cardapio> {
  const supabase = createClient()

  const { data: existentes, error: erroBusca } = await supabase
    .from('cardapio_v2_cardapios')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (erroBusca) throw new Error(erroBusca.message)
  if (existentes && existentes.length > 0) return existentes[0]

  const { data: criado, error: erroCriacao } = await supabase
    .from('cardapio_v2_cardapios')
    .insert({ estabelecimento_id: estabelecimentoId, nome: 'Cardápio', canal_padrao: 'ambos' })
    .select('*')
    .single()

  // error do supabase-js é um objeto plano, não Error — sem o
  // new Error(...) o overlay do Next mostra "[object Object]" em vez da
  // mensagem real (mesmo padrão de estoqueRepository.ts).
  if (erroCriacao) throw new Error(erroCriacao.message)
  if (!criado) throw new Error('Falha ao criar cardápio padrão')
  return criado
}

export async function atualizarCanalPadrao(cardapioId: string, canal: CanalPadraoCardapioV2): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_cardapios').update({ canal_padrao: canal }).eq('id', cardapioId)
  if (error) throw new Error(error.message)
}

export async function atualizarRecursosOpcionais(cardapioId: string, dados: Partial<RecursosOpcionaisCardapio>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_cardapios').update(dados).eq('id', cardapioId)
  if (error) throw new Error(error.message)
}

export async function atualizarAparencia(cardapioId: string, dados: Partial<AparenciaCardapio>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_cardapios').update(dados).eq('id', cardapioId)
  if (error) throw new Error(error.message)
}
