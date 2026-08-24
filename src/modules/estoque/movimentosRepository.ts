import { createClient } from '@/lib/supabase/client'
import type { MovimentoEstoque, TipoMovimentoEstoque } from './types'

const MOTIVO_OBRIGATORIO: TipoMovimentoEstoque[] = ['perda', 'cortesia', 'ajuste_inventario']

// Só 'entrada' soma no estoque — todo o resto (saída manual, venda, perda,
// cortesia, ajuste de inventário) subtrai. O sinal do efeito vem do tipo,
// não do valor digitado (quantidade é sempre positiva).
const TIPOS_QUE_SOMAM: TipoMovimentoEstoque[] = ['entrada']

export interface DadosMovimento {
  insumoId: string
  tipo: TipoMovimentoEstoque
  quantidade: number
  motivo: string | null
}

export async function listarMovimentos(estabelecimentoId: string, limite = 200): Promise<MovimentoEstoque[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('movimentos_estoque')
    .select('id, estabelecimento_id, insumo_id, tipo, quantidade, motivo, criado_por, created_at, insumo:insumo_id(nome, unidade)')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: false })
    .limit(limite)
  if (error) throw new Error(error.message)

  const movimentos = (data || []) as unknown as MovimentoEstoque[]

  // Mesmo padrão de resolução de nome já usado em caixaRepository.ts —
  // uma consulta batelada em profiles em vez de uma por linha.
  const idsUsuarios = Array.from(new Set(movimentos.map((m) => m.criado_por).filter((id): id is string => !!id)))
  if (idsUsuarios.length > 0) {
    const { data: perfis } = await supabase.from('profiles').select('id, nome, email').in('id', idsUsuarios)
    const nomesPorId: Record<string, string> = {}
    for (const perfil of perfis || []) nomesPorId[perfil.id] = perfil.nome || perfil.email || perfil.id
    for (const mov of movimentos) mov.nomeCriador = mov.criado_por ? nomesPorId[mov.criado_por] || null : null
  }

  return movimentos
}

/**
 * Lança um movimento manual e ajusta insumos.estoque_atual na mesma
 * direção (soma pra entrada, subtrai pros demais) — motivo obrigatório
 * pra perda/cortesia/ajuste_inventario, checado aqui além do constraint
 * no banco (mensagem de erro melhor pro formulário).
 */
export async function lancarMovimento(estabelecimentoId: string, dados: DadosMovimento) {
  if (MOTIVO_OBRIGATORIO.includes(dados.tipo) && !dados.motivo?.trim()) {
    throw new Error('Informe o motivo pra esse tipo de movimento.')
  }
  if (dados.quantidade <= 0) {
    throw new Error('Quantidade precisa ser maior que zero.')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: insumo, error: erroInsumo } = await supabase
    .from('insumos')
    .select('estoque_atual')
    .eq('id', dados.insumoId)
    .single()
  if (erroInsumo || !insumo) throw new Error(erroInsumo?.message || 'Insumo não encontrado.')

  const soma = TIPOS_QUE_SOMAM.includes(dados.tipo)
  const novaQuantidade = soma
    ? insumo.estoque_atual + dados.quantidade
    : Math.max(0, insumo.estoque_atual - dados.quantidade)

  const { error: erroMovimento } = await supabase.from('movimentos_estoque').insert({
    estabelecimento_id: estabelecimentoId,
    insumo_id: dados.insumoId,
    tipo: dados.tipo,
    quantidade: dados.quantidade,
    motivo: dados.motivo?.trim() || null,
    criado_por: user?.id || null,
  })
  if (erroMovimento) throw new Error(erroMovimento.message)

  const { error: erroUpdate } = await supabase
    .from('insumos')
    .update({ estoque_atual: novaQuantidade, updated_at: new Date().toISOString() })
    .eq('id', dados.insumoId)
  if (erroUpdate) throw new Error(erroUpdate.message)
}
