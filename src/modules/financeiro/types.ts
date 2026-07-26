export type StatusSessaoCaixa = 'aberto' | 'fechado'

export interface SessaoCaixa {
  id: string
  estabelecimento_id: string
  aberto_por: string | null
  fechado_por: string | null
  valor_abertura: number
  valor_fechamento: number | null
  valor_esperado: number | null
  diferenca: number | null
  status: StatusSessaoCaixa
  observacoes: string | null
  aberto_em: string
  fechado_em: string | null
}

export interface ResumoSessaoCaixa {
  totalVendas: number
  totalDesconto: number
  quantidadePedidos: number
  porMetodoPagamento: Record<string, number>
}
