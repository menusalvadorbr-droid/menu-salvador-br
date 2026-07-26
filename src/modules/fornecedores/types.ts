export interface Fornecedor {
  id: string
  estabelecimento_id: string
  nome: string
  telefone: string | null
  email: string | null
  observacoes: string | null
  created_at: string
}

export type StatusPedidoCompra = 'pendente' | 'recebido' | 'cancelado'

export interface ItemPedidoCompra {
  id: string
  pedido_compra_id: string
  insumo_id: string
  quantidade: number
  valor_unitario: number
  insumo?: { nome: string; unidade: string }
}

export interface PedidoCompra {
  id: string
  estabelecimento_id: string
  fornecedor_id: string | null
  status: StatusPedidoCompra
  valor_total: number
  observacoes: string | null
  criado_em: string
  recebido_em: string | null
  fornecedor?: { nome: string }
  itens?: ItemPedidoCompra[]
}

export interface NovoItemPedidoCompra {
  insumoId: string
  quantidade: number
  valorUnitario: number
}
