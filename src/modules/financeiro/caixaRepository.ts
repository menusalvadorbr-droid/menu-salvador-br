import { createClient } from '@/lib/supabase/client'
import type { SessaoCaixa, ResumoSessaoCaixa } from './types'

/**
 * IMPORTANTE PRA FUTURA IMPLEMENTAÇÃO OFFLINE:
 * Este arquivo é o único ponto de acesso a dados do módulo financeiro —
 * nenhum componente ou hook fala com o Supabase diretamente. Isso é de
 * propósito: quando o "offline básico" for implementado (ver README_ERP.md),
 * a ideia é que baste adaptar as funções AQUI (ex: tentar Supabase, cair pra
 * fila local, igual o módulo de pedidos já faz em ordersRepository.ts) sem
 * precisar tocar em nenhum componente de tela.
 */

export async function obterSessaoAberta(estabelecimentoId: string): Promise<SessaoCaixa | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'aberto')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function abrirCaixa(
  estabelecimentoId: string,
  valorAbertura: number,
  observacoes?: string
): Promise<SessaoCaixa> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('caixa_sessoes')
    .insert({
      estabelecimento_id: estabelecimentoId,
      aberto_por: user?.id,
      valor_abertura: valorAbertura,
      observacoes: observacoes || null,
      status: 'aberto',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function resumoSessao(sessaoId: string): Promise<ResumoSessaoCaixa> {
  const supabase = createClient()
  const { data: pedidos, error } = await supabase
    .from('orders')
    .select('total, desconto, metodo_pagamento')
    .eq('caixa_sessao_id', sessaoId)
    .eq('status', 'pago')

  if (error) throw new Error(error.message)

  const porMetodoPagamento: Record<string, number> = {}
  let totalVendas = 0
  let totalDesconto = 0

  for (const pedido of pedidos || []) {
    totalVendas += pedido.total || 0
    totalDesconto += pedido.desconto || 0
    const metodo = pedido.metodo_pagamento || 'Não informado'
    porMetodoPagamento[metodo] = (porMetodoPagamento[metodo] || 0) + (pedido.total || 0)
  }

  return {
    totalVendas,
    totalDesconto,
    quantidadePedidos: pedidos?.length || 0,
    porMetodoPagamento,
  }
}

export async function fecharCaixa(sessaoId: string, valorInformado: number): Promise<SessaoCaixa> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessao, error: erroSessao } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('id', sessaoId)
    .single()
  if (erroSessao) throw erroSessao

  const resumo = await resumoSessao(sessaoId)
  const valorEsperado = sessao.valor_abertura + resumo.totalVendas

  const { data, error } = await supabase
    .from('caixa_sessoes')
    .update({
      status: 'fechado',
      valor_fechamento: valorInformado,
      valor_esperado: valorEsperado,
      diferenca: valorInformado - valorEsperado,
      fechado_por: user?.id,
      fechado_em: new Date().toISOString(),
    })
    .eq('id', sessaoId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listarSessoes(estabelecimentoId: string): Promise<SessaoCaixa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('aberto_em', { ascending: false })
    .limit(30)

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Chamada pelo módulo de pedidos quando um pedido é marcado como pago —
 * vincula o pedido à sessão de caixa aberta no momento (se houver).
 * Se não houver caixa aberto, o pedido simplesmente não fica associado a
 * nenhuma sessão (não bloqueia o fluxo do pedido).
 */
export async function vincularPedidoASessaoAberta(estabelecimentoId: string, pedidoId: string) {
  const sessaoAberta = await obterSessaoAberta(estabelecimentoId)
  if (!sessaoAberta) return

  const supabase = createClient()
  await supabase.from('orders').update({ caixa_sessao_id: sessaoAberta.id }).eq('id', pedidoId)
}
