export interface ItemPedido {
  id: string
  nome: string
  preco: number
  preco_promocional?: number
  quantidade: number
  observacao?: string
}

export type StatusPedido =
  | 'recebido'
  | 'aprovado'
  | 'em_preparo'
  | 'pronto'
  | 'entregue'
  | 'pago'
  | 'cancelado'

export type StatusMesa = 'livre' | 'ocupada' | 'reservada' | 'fechada'

export interface Mesa {
  id: string
  estabelecimento_id: string
  numero: string
  capacidade: number | null
  status: StatusMesa
  created_at: string
}

export type TipoPedido = 'mesa' | 'balcao' | 'retirada' | 'entrega'

export const ETIQUETA_TIPO_PEDIDO: Record<TipoPedido, string> = {
  mesa: '🍽️ Mesa',
  balcao: '🧾 Balcão',
  retirada: '🛍️ Retirada',
  entrega: '🛵 Entrega',
}

export interface Pedido {
  id: string
  estabelecimento_id: string
  items: ItemPedido[]
  total: number
  desconto: number | null
  nome_cliente: string | null
  mesa: string | null
  mesa_id: string | null
  tipo_pedido: TipoPedido
  endereco_entrega: string | null
  observacoes: string | null
  status: StatusPedido
  metodo_pagamento: string | null
  origem: 'app' | 'garcom' | 'whatsapp_contingencia'
  pendente_sincronizacao: boolean
  created_at: string
  approved_at: string | null
  ready_at: string | null
  delivered_at: string | null
  paid_at: string | null
  staff_id: string | null
}

export interface NovoPedidoInput {
  estabelecimento_id: string
  items: ItemPedido[]
  total: number
  nome_cliente?: string
  mesa?: string
  mesa_id?: string
  tipo_pedido?: TipoPedido
  endereco_entrega?: string
  observacoes?: string
  metodo_pagamento?: string
  origem?: 'app' | 'garcom'
}

export const ETIQUETA_STATUS: Record<StatusPedido, string> = {
  recebido: '🆕 Recebido',
  aprovado: '✅ Aprovado',
  em_preparo: '👨‍🍳 Em preparo',
  pronto: '🔔 Pronto',
  entregue: '📦 Entregue',
  pago: '💰 Pago',
  cancelado: '❌ Cancelado',
}
