import { createClient } from '@/lib/supabase/client'
import type { Fornecedor, PedidoCompra, NovoItemPedidoCompra } from './types'

export async function listarFornecedores(estabelecimentoId: string): Promise<Fornecedor[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function criarFornecedor(
  estabelecimentoId: string,
  nome: string,
  telefone?: string,
  email?: string,
  observacoes?: string
) {
  const supabase = createClient()
  const { error } = await supabase.from('fornecedores').insert({
    estabelecimento_id: estabelecimentoId,
    nome,
    telefone: telefone || null,
    email: email || null,
    observacoes: observacoes || null,
  })
  if (error) throw new Error(error.message)
}

export async function removerFornecedor(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listarPedidosCompra(estabelecimentoId: string): Promise<PedidoCompra[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos_compra')
    .select('*, fornecedor:fornecedores(nome)')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('criado_em', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data || []) as PedidoCompra[]
}

export async function criarPedidoCompra(
  estabelecimentoId: string,
  fornecedorId: string | null,
  itens: NovoItemPedidoCompra[],
  observacoes?: string
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const valorTotal = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)

  const { data: pedido, error: erroPedido } = await supabase
    .from('pedidos_compra')
    .insert({
      estabelecimento_id: estabelecimentoId,
      fornecedor_id: fornecedorId,
      status: 'pendente',
      valor_total: valorTotal,
      observacoes: observacoes || null,
      criado_por: user?.id,
    })
    .select()
    .single()

  if (erroPedido) throw new Error(erroPedido.message)

  const { error: erroItens } = await supabase.from('itens_pedido_compra').insert(
    itens.map((item) => ({
      pedido_compra_id: pedido.id,
      insumo_id: item.insumoId,
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario,
    }))
  )

  if (erroItens) throw new Error(erroItens.message)

  return pedido
}

export async function listarItensPedidoCompra(pedidoCompraId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itens_pedido_compra')
    .select('*, insumo:insumos(nome, unidade)')
    .eq('pedido_compra_id', pedidoCompraId)
  if (error) throw new Error(error.message)
  return data || []
}

export async function cancelarPedidoCompra(pedidoCompraId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pedidos_compra')
    .update({ status: 'cancelado' })
    .eq('id', pedidoCompraId)
  if (error) throw new Error(error.message)
}

/**
 * Marca o pedido como recebido E dá entrada automática no estoque —
 * fecha o ciclo com o módulo de estoque (que dá BAIXA quando um pedido
 * do cliente entra em preparo). Se algum item já tiver sido removido do
 * cadastro de insumos nesse meio tempo, ele é ignorado (não trava o
 * recebimento do restante).
 */
export async function marcarPedidoComoRecebido(pedidoCompraId: string) {
  const supabase = createClient()

  const itens = await listarItensPedidoCompra(pedidoCompraId)

  for (const item of itens) {
    const { data: insumo } = await supabase
      .from('insumos')
      .select('estoque_atual')
      .eq('id', item.insumo_id)
      .maybeSingle()

    if (!insumo) continue

    await supabase
      .from('insumos')
      .update({
        estoque_atual: insumo.estoque_atual + item.quantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.insumo_id)
  }

  const { error } = await supabase
    .from('pedidos_compra')
    .update({ status: 'recebido', recebido_em: new Date().toISOString() })
    .eq('id', pedidoCompraId)

  if (error) throw new Error(error.message)
}
