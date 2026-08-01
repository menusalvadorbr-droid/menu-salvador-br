export interface VariacaoSelecionada {
  id: string
  nome: string
  preco: number
}

export interface ComplementoSelecionado {
  grupoId: string
  grupoNome: string
  opcaoId: string
  opcaoNome: string
  precoAdicional: number
}

export interface ItemPedido {
  id: string
  nome: string
  preco: number
  preco_promocional?: number
  quantidade: number
  observacao?: string
  // Tamanho escolhido (quando o item tem variacoes_item) — preco já reflete
  // o preço da variação (não o preço-base "a partir de" do item).
  variacao?: VariacaoSelecionada | null
  // Complementos escolhidos, achatados de todos os grupos aplicáveis
  // (os do item + os condicionalmente liberados por opcao_grupo_complemento).
  complementos?: ComplementoSelecionado[]
  // Identifica uma linha única no carrinho — dois acréscimos do mesmo item
  // com variação/complementos diferentes não podem se fundir numa só
  // linha (por isso não dá pra usar só `id`, que dois lançamentos do
  // mesmo prato compartilham). Itens sem variação/complementos usam o
  // próprio `id` como linhaId, preservando o comportamento de sempre
  // (repetir "+ Adicionar" só incrementa a quantidade).
  linhaId?: string
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
  staff_id?: string
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
