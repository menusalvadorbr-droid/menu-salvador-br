import { createClient } from '@/lib/supabase/client'
import type { ItemPedido } from '../types'
import type { TipoDesconto } from '@/lib/desconto'

export interface VendaBalcaoPausada {
  id: string
  nome_cliente: string | null
  itens: ItemPedido[]
  tipo_desconto: TipoDesconto
  desconto_input: string | null
  created_at: string
}

export async function listarVendasPausadas(caixaSessaoId: string): Promise<VendaBalcaoPausada[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vendas_balcao_pausadas')
    .select('id, nome_cliente, itens, tipo_desconto, desconto_input, created_at')
    .eq('caixa_sessao_id', caixaSessaoId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function pausarVenda(input: {
  estabelecimentoId: string
  caixaSessaoId: string
  nomeCliente: string
  itens: ItemPedido[]
  tipoDesconto: TipoDesconto
  descontoInput: string
}): Promise<VendaBalcaoPausada> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('vendas_balcao_pausadas')
    .insert({
      estabelecimento_id: input.estabelecimentoId,
      caixa_sessao_id: input.caixaSessaoId,
      nome_cliente: input.nomeCliente.trim() || null,
      itens: input.itens,
      tipo_desconto: input.tipoDesconto,
      desconto_input: input.descontoInput || null,
      criado_por: user?.id || null,
    })
    .select('id, nome_cliente, itens, tipo_desconto, desconto_input, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function excluirVendaPausada(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('vendas_balcao_pausadas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
