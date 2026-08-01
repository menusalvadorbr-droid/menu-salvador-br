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

export interface PagamentoMesa {
  id: string
  estabelecimento_id: string
  mesa_id: string
  valor: number
  forma_pagamento: string | null
  nome_pagador: string | null
  caixa_sessao_id: string | null
  criado_por: string | null
  created_at: string
}

/**
 * Uma linha na lista de vendas do caixa — 'pedido' é um pedido avulso
 * (balcão/retirada/entrega) marcado como pago individualmente; 'pagamento'
 * é uma linha de pagamentos_mesa, que cobre TODA a receita vinda de mesa
 * (parcelada ou fechada de uma vez só) — pedidos de mesa não entram aqui
 * separadamente pra não contar a mesma venda duas vezes.
 */
export interface VendaSessao {
  id: string
  tipo: 'pedido' | 'pagamento'
  criadoEm: string
  pagoEm: string
  valor: number
  formaPagamento: string | null
  mesa: string | null
  mesaId: string | null
  nomeCliente: string | null
  // Só preenchidos pra tipo 'pedido' — resto da linha do tempo, pro detalhe
  // expandido na lista de vendas.
  prontoEm: string | null
  entregueEm: string | null
}

export interface ResumoSessaoCaixa {
  totalVendas: number
  totalDesconto: number
  quantidadePedidos: number
  porMetodoPagamento: Record<string, number>
  vendas: VendaSessao[]
}

/** Uma linha de pedido no demonstrativo detalhado — dentro de um grupo de
 *  mesa, ou na lista de avulsos (balcão/retirada/entrega). */
export interface PedidoResumoDemonstrativo {
  id: string
  numero: string
  criadoEm: string
  entregueEm: string | null
  pagoEm: string | null
  valor: number
  metodoPagamento: string | null
  funcionario: string | null
}

/** Uma parcela de pagamentos_mesa no demonstrativo — parcial ou o
 *  pagamento final que fechou a mesa, sem distinção entre os dois. */
export interface PagamentoResumoDemonstrativo {
  id: string
  horario: string
  valor: number
  nomePagador: string | null
  formaPagamento: string | null
  funcionario: string | null
}

export interface GrupoMesaDemonstrativo {
  mesaId: string
  numeroMesa: string
  pedidos: PedidoResumoDemonstrativo[]
  pagamentos: PagamentoResumoDemonstrativo[]
  totalPedidos: number
  totalPagamentos: number
  /** false = pagamentos somados ainda não cobrem o total dos pedidos —
   *  mesa fechada no caixa com saldo em aberto, precisa de atenção. */
  quitada: boolean
}

export interface DemonstrativoSessao {
  sessao: SessaoCaixa
  abertoPorNome: string | null
  fechadoPorNome: string | null
  gruposMesa: GrupoMesaDemonstrativo[]
  pedidosAvulsos: PedidoResumoDemonstrativo[]
  totalPorFormaPagamento: Record<string, number>
  totalGeral: number
}
