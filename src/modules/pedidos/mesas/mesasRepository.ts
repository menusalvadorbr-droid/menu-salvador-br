import { createClient } from '@/lib/supabase/client'
import type { Mesa, StatusMesa } from './types'

export async function listarMesas(estabelecimentoId: string): Promise<Mesa[]> {
  const supabase = createClient()

  const { data: mesas, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('numero', { ascending: true })

  if (error) throw new Error(error.message)

  // Mesas com status manual (reservada/fechada) mantêm o que o staff definiu.
  // As demais (marcadas como 'livre' no banco) são recalculadas: se existe
  // pedido ativo (não pago/cancelado) vinculado, mostramos como 'ocupada'.
  const { data: pedidosAtivos } = await supabase
    .from('orders')
    .select('mesa_id')
    .eq('estabelecimento_id', estabelecimentoId)
    .not('mesa_id', 'is', null)
    .not('status', 'in', '(pago,cancelado)')

  const mesasComPedidoAtivo = new Set((pedidosAtivos || []).map((p) => p.mesa_id))

  return (mesas || []).map((mesa) => ({
    ...mesa,
    status:
      mesa.status === 'reservada' || mesa.status === 'fechada'
        ? mesa.status
        : mesasComPedidoAtivo.has(mesa.id)
          ? 'ocupada'
          : 'livre',
  })) as Mesa[]
}

export async function criarMesa(estabelecimentoId: string, numero: string, capacidade?: number) {
  const supabase = createClient()
  const { error } = await supabase.from('mesas').insert({
    estabelecimento_id: estabelecimentoId,
    numero,
    capacidade: capacidade || null,
  })
  if (error) throw new Error(error.message)
}

export async function atualizarStatusMesa(mesaId: string, status: StatusMesa) {
  const supabase = createClient()
  const { error } = await supabase.from('mesas').update({ status }).eq('id', mesaId)
  if (error) throw new Error(error.message)
}

export async function removerMesa(mesaId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('mesas').delete().eq('id', mesaId)
  if (error) throw new Error(error.message)
}
