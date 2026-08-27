import type { Pedido } from '../pedidos/types'

export interface MensagemConversa {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ConversaFilaIA {
  id: string
  telefone: string
  mensagens: MensagemConversa[]
  precisa_humano: boolean
  ultima_interacao_em: string
}

export type StatusValidacao = 'pendente' | 'aceito' | 'recusado'

export interface ValidacaoPedido {
  id: string
  pedido_id: string
  estabelecimento_id: string
  status: StatusValidacao
  motivo_recusa: string | null
  validado_por: string | null
  validado_em: string | null
  created_at: string
  pedido: Pedido
}
