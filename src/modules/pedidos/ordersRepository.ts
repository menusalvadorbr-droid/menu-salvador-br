import { createClient } from '@/lib/supabase/client'
import type { NovoPedidoInput, Pedido, StatusPedido } from './types'
import { adicionarPendente, listarPendentes, removerPendente, incrementarTentativa } from './localQueue'

export interface ResultadoCriarPedido {
  sucesso: boolean
  modo: 'online' | 'contingencia'
  pedidoId?: string
}

/**
 * Tenta gravar o pedido no Supabase. Se falhar por qualquer motivo de rede
 * (não por erro de validação), assume que estamos em contingência: guarda
 * na fila local para sincronizar depois e devolve modo='contingencia' para
 * quem chamou decidir se aciona o fallback de WhatsApp.
 */
export async function criarPedido(input: NovoPedidoInput): Promise<ResultadoCriarPedido> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .insert({
        estabelecimento_id: input.estabelecimento_id,
        items: input.items,
        total: input.total,
        nome_cliente: input.nome_cliente || null,
        mesa: input.mesa || null,
        mesa_id: input.mesa_id || null,
        tipo_pedido: input.tipo_pedido || 'mesa',
        endereco_entrega: input.endereco_entrega || null,
        observacoes: input.observacoes || null,
        metodo_pagamento: input.metodo_pagamento || null,
        status: 'recebido',
        origem: input.origem || 'app',
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    return { sucesso: true, modo: 'online', pedidoId: data.id }
  } catch {
    // Sem conexão ou Supabase fora do ar — entra em modo de contingência.
    adicionarPendente(input)
    return { sucesso: true, modo: 'contingencia' }
  }
}

/**
 * Tenta sincronizar todos os pedidos presos na fila local. Chamado
 * automaticamente quando a conexão volta (ver hooks/useSincronizacao.ts).
 */
export async function sincronizarPendentes(): Promise<{ sincronizados: number; restantes: number }> {
  const pendentes = listarPendentes()
  if (pendentes.length === 0) return { sincronizados: 0, restantes: 0 }

  const supabase = createClient()
  let sincronizados = 0

  for (const pendente of pendentes) {
    try {
      const { error } = await supabase.from('orders').insert({
        estabelecimento_id: pendente.input.estabelecimento_id,
        items: pendente.input.items,
        total: pendente.input.total,
        nome_cliente: pendente.input.nome_cliente || null,
        mesa: pendente.input.mesa || null,
        mesa_id: pendente.input.mesa_id || null,
        tipo_pedido: pendente.input.tipo_pedido || 'mesa',
        endereco_entrega: pendente.input.endereco_entrega || null,
        observacoes: pendente.input.observacoes || null,
        metodo_pagamento: pendente.input.metodo_pagamento || null,
        status: 'recebido',
        origem: pendente.input.origem === 'garcom' ? 'garcom' : 'whatsapp_contingencia',
        pendente_sincronizacao: false,
        created_at: pendente.criadoEm,
      })
      if (error) throw new Error(error.message)

      removerPendente(pendente.idLocal)
      sincronizados++
    } catch {
      incrementarTentativa(pendente.idLocal)
      // segue tentando os próximos; esse fica na fila pra próxima tentativa
    }
  }

  return { sincronizados, restantes: listarPendentes().length }
}

export async function listarPedidosDoEstabelecimento(estabelecimentoId: string): Promise<Pedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data || []) as Pedido[]
}

const PROXIMO_TIMESTAMP_POR_STATUS: Partial<Record<StatusPedido, string>> = {
  aprovado: 'approved_at',
  pronto: 'ready_at',
  entregue: 'delivered_at',
  pago: 'paid_at',
}

export async function atualizarStatusPedido(pedidoId: string, novoStatus: StatusPedido) {
  const supabase = createClient()
  const campoTimestamp = PROXIMO_TIMESTAMP_POR_STATUS[novoStatus]

  const atualizacao: Record<string, unknown> = { status: novoStatus }
  if (campoTimestamp) atualizacao[campoTimestamp] = new Date().toISOString()

  const { error } = await supabase.from('orders').update(atualizacao).eq('id', pedidoId)
  if (error) throw new Error(error.message)
}
