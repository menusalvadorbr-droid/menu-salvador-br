import { createClient } from '@/lib/supabase/client'
import { atualizarStatusPedido } from '../pedidos/ordersRepository'
import { vincularPedidoASessaoAberta } from '../financeiro/caixaRepository'
import type { Pedido } from '../pedidos/types'
import type { ValidacaoPedido } from './types'

/** Pix ainda não confirmado — não existe estado dedicado pra isso (status
 *  não tem valor "aguardando pix", metodo_pagamento é texto livre), então é
 *  derivado: pago em Pix, mas ainda não chegou em "pago" nem foi cancelado. */
export async function listarPixPendentes(estabelecimentoId: string): Promise<Pedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('metodo_pagamento', 'Pix')
    .not('status', 'in', '(pago,cancelado)')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Pedido[]
}

/** Reaproveita exatamente o par de chamadas que já roda quando um pedido
 *  vira "pago" pelo board de comandas (usePedidosEstabelecimento.ts) — não
 *  reinventa o efeito colateral de vínculo com o caixa. */
export async function confirmarPagamentoPix(estabelecimentoId: string, pedidoId: string): Promise<void> {
  await atualizarStatusPedido(pedidoId, 'pago')
  try {
    await vincularPedidoASessaoAberta(estabelecimentoId, pedidoId)
  } catch {
    // Sem caixa aberto não deve travar a confirmação — mesmo comportamento
    // já aceito em usePedidosEstabelecimento.ts.
  }
}

export async function listarValidacoesPendentes(estabelecimentoId: string): Promise<ValidacaoPedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('validacao_pedidos')
    .select('*, pedido:orders(*)')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as unknown as ValidacaoPedido[]
}

export async function aceitarValidacao(validacaoId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('validacao_pedidos')
    .update({ status: 'aceito', validado_por: user?.id || null, validado_em: new Date().toISOString() })
    .eq('id', validacaoId)
  if (error) throw new Error(error.message)
}

export async function recusarValidacao(validacaoId: string, motivo: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('validacao_pedidos')
    .update({
      status: 'recusado',
      motivo_recusa: motivo,
      validado_por: user?.id || null,
      validado_em: new Date().toISOString(),
    })
    .eq('id', validacaoId)
  if (error) throw new Error(error.message)
}

/** "Cliente conhecido" — conta pedidos anteriores com o mesmo telefone
 *  normalizado neste estabelecimento, excluindo o próprio pedido e
 *  cancelados (pedido cancelado não é histórico de compra real). */
export async function contarPedidosAnteriores(
  estabelecimentoId: string,
  telefone: string,
  excluirPedidoId: string
): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('telefone', telefone)
    .neq('id', excluirPedidoId)
    .neq('status', 'cancelado')

  if (error) throw new Error(error.message)
  return count || 0
}

/** Contagem leve das 3 pendências, pro badge do atalho em ModuloGestao —
 *  3 counts em paralelo, sem trazer os dados inteiros. */
export async function contarPendenciasOperador(estabelecimentoId: string): Promise<number> {
  const supabase = createClient()
  const [ia, pix, validacao] = await Promise.all([
    supabase
      .from('whatsapp_conversas')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('precisa_humano', true),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('metodo_pagamento', 'Pix')
      .not('status', 'in', '(pago,cancelado)'),
    supabase
      .from('validacao_pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('status', 'pendente'),
  ])
  return (ia.count || 0) + (pix.count || 0) + (validacao.count || 0)
}
