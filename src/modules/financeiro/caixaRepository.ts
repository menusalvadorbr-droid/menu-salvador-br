import { createClient } from '@/lib/supabase/client'
import type {
  SessaoCaixa,
  ResumoSessaoCaixa,
  VendaSessao,
  PagamentoMesa,
  MovimentacaoCaixa,
  TipoMovimentacaoCaixa,
  DemonstrativoSessao,
  GrupoMesaDemonstrativo,
  PedidoResumoDemonstrativo,
  PagamentoResumoDemonstrativo,
} from './types'

/**
 * IMPORTANTE PRA FUTURA IMPLEMENTAÇÃO OFFLINE:
 * Este arquivo é o único ponto de acesso a dados do módulo financeiro —
 * nenhum componente ou hook fala com o Supabase diretamente. Isso é de
 * propósito: quando o "offline básico" for implementado (ver README_ERP.md),
 * a ideia é que baste adaptar as funções AQUI (ex: tentar Supabase, cair pra
 * fila local, igual o módulo de pedidos já faz em ordersRepository.ts) sem
 * precisar tocar em nenhum componente de tela.
 */

export async function obterSessaoAberta(estabelecimentoId: string): Promise<SessaoCaixa | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'aberto')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function abrirCaixa(
  estabelecimentoId: string,
  valorAbertura: number,
  observacoes?: string
): Promise<SessaoCaixa> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('caixa_sessoes')
    .insert({
      estabelecimento_id: estabelecimentoId,
      aberto_por: user?.id,
      valor_abertura: valorAbertura,
      observacoes: observacoes || null,
      status: 'aberto',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function resumoSessao(sessaoId: string): Promise<ResumoSessaoCaixa> {
  const supabase = createClient()

  const [
    { data: pedidos, error: erroPedidos },
    { data: pagamentos, error: erroPagamentos },
    { data: movimentacoes, error: erroMovimentacoes },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, desconto, metodo_pagamento, created_at, ready_at, delivered_at, paid_at, mesa, mesa_id, nome_cliente')
      .eq('caixa_sessao_id', sessaoId)
      .eq('status', 'pago'),
    supabase
      .from('pagamentos_mesa')
      .select('id, valor, desconto, forma_pagamento, created_at, mesa_id, mesas(numero)')
      .eq('caixa_sessao_id', sessaoId),
    supabase
      .from('caixa_movimentacoes')
      .select('*')
      .eq('caixa_sessao_id', sessaoId)
      .order('created_at', { ascending: false }),
  ])

  if (erroPedidos) throw new Error(erroPedidos.message)
  if (erroPagamentos) throw new Error(erroPagamentos.message)
  if (erroMovimentacoes) throw new Error(erroMovimentacoes.message)

  const porMetodoPagamento: Record<string, number> = {}
  let totalVendas = 0
  let totalDesconto = 0

  for (const pedido of pedidos || []) {
    totalDesconto += pedido.desconto || 0
    // Pedido de mesa: o valor já foi contado através de pagamentos_mesa no
    // momento em que a conta foi fechada (parcelado ou de uma vez só) —
    // somar de novo aqui contaria a mesma venda duas vezes. Só pedido
    // avulso (balcão/retirada/entrega, sem mesa_id) soma direto aqui.
    if (pedido.mesa_id) continue
    totalVendas += pedido.total || 0
    const metodo = pedido.metodo_pagamento || 'Não informado'
    porMetodoPagamento[metodo] = (porMetodoPagamento[metodo] || 0) + (pedido.total || 0)
  }

  for (const pagamento of pagamentos || []) {
    totalVendas += pagamento.valor || 0
    totalDesconto += pagamento.desconto || 0
    const metodo = pagamento.forma_pagamento || 'Não informado'
    porMetodoPagamento[metodo] = (porMetodoPagamento[metodo] || 0) + (pagamento.valor || 0)
  }

  const vendas: VendaSessao[] = [
    ...(pedidos || [])
      .filter((p) => !p.mesa_id)
      .map((p) => ({
        id: p.id,
        tipo: 'pedido' as const,
        criadoEm: p.created_at,
        pagoEm: p.paid_at || p.created_at,
        valor: p.total || 0,
        formaPagamento: p.metodo_pagamento,
        mesa: p.mesa,
        mesaId: null,
        nomeCliente: p.nome_cliente,
        prontoEm: p.ready_at,
        entregueEm: p.delivered_at,
      })),
    ...(pagamentos || []).map((pg) => {
      const mesaJoin = pg.mesas as unknown as { numero: string } | { numero: string }[] | null
      const numeroMesa = Array.isArray(mesaJoin) ? mesaJoin[0]?.numero : mesaJoin?.numero
      return {
        id: pg.id,
        tipo: 'pagamento' as const,
        criadoEm: pg.created_at,
        pagoEm: pg.created_at,
        valor: pg.valor || 0,
        formaPagamento: pg.forma_pagamento,
        mesa: numeroMesa || null,
        mesaId: pg.mesa_id,
        nomeCliente: null,
        prontoEm: null,
        entregueEm: null,
      }
    }),
  ].sort((a, b) => new Date(b.pagoEm).getTime() - new Date(a.pagoEm).getTime())

  const totalSangrias = (movimentacoes || [])
    .filter((m) => m.tipo === 'sangria')
    .reduce((soma, m) => soma + (m.valor || 0), 0)
  const totalSuprimentos = (movimentacoes || [])
    .filter((m) => m.tipo === 'suprimento')
    .reduce((soma, m) => soma + (m.valor || 0), 0)

  return {
    totalVendas,
    totalDesconto,
    quantidadePedidos: pedidos?.length || 0,
    porMetodoPagamento,
    vendas,
    movimentacoes: movimentacoes || [],
    totalSangrias,
    totalSuprimentos,
  }
}

/**
 * Registra uma sangria (retirada) ou suprimento (reforço) de dinheiro na
 * gaveta durante o turno. Só pode ser lançada contra uma sessão aberta —
 * entra automaticamente no cálculo do valor esperado no fechamento.
 */
export async function registrarMovimentacaoCaixa(
  estabelecimentoId: string,
  caixaSessaoId: string,
  tipo: TipoMovimentacaoCaixa,
  valor: number,
  motivo?: string
): Promise<MovimentacaoCaixa> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('caixa_movimentacoes')
    .insert({
      estabelecimento_id: estabelecimentoId,
      caixa_sessao_id: caixaSessaoId,
      tipo,
      valor,
      motivo: motivo?.trim() || null,
      criado_por: user?.id || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Quanto ainda falta pagar da rodada ATUAL de pedidos em aberto de uma
 * mesa — soma os pedidos não pagos/cancelados e subtrai os pagamentos já
 * registrados em pagamentos_mesa para essa mesa. Só conta pagamentos feitos
 * depois que o pedido em aberto mais antigo dessa rodada chegou: assim um
 * pagamento de uma comanda anterior, já fechada, da mesma mesa física, não
 * "vaza" pro saldo da rodada nova (não existe outro jeito de amarrar um
 * pagamento a uma rodada específica sem uma coluna nova pra isso).
 */
export async function saldoPendenteDaMesa(
  mesaId: string
): Promise<{ totalAberto: number; totalPago: number; saldo: number }> {
  const supabase = createClient()

  const { data: pedidosAbertos, error: erroPedidos } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('mesa_id', mesaId)
    .not('status', 'in', '(pago,cancelado)')

  if (erroPedidos) throw new Error(erroPedidos.message)

  const totalAberto = (pedidosAbertos || []).reduce((soma, p) => soma + (p.total || 0), 0)

  if (!pedidosAbertos || pedidosAbertos.length === 0) {
    return { totalAberto: 0, totalPago: 0, saldo: 0 }
  }

  const desde = pedidosAbertos.reduce(
    (min, p) => (p.created_at < min ? p.created_at : min),
    pedidosAbertos[0].created_at
  )

  const { data: pagamentos, error: erroPagamentos } = await supabase
    .from('pagamentos_mesa')
    .select('valor')
    .eq('mesa_id', mesaId)
    .gte('created_at', desde)

  if (erroPagamentos) throw new Error(erroPagamentos.message)

  const totalPago = (pagamentos || []).reduce((soma, p) => soma + (p.valor || 0), 0)

  return { totalAberto, totalPago, saldo: totalAberto - totalPago }
}

/**
 * Registra um pagamento (parcial ou o que cobre o resto de uma vez só) pra
 * uma mesa — vincula à sessão de caixa aberta no momento, se houver, igual
 * ao vincularPedidoASessaoAberta abaixo (mesmo princípio: sem caixa aberto,
 * o pagamento é gravado do mesmo jeito, só fica sem sessão associada).
 */
export async function registrarPagamentoParcial(
  estabelecimentoId: string,
  mesaId: string,
  valor: number,
  formaPagamento: string,
  nomePagador?: string,
  desconto?: number
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sessaoAberta = await obterSessaoAberta(estabelecimentoId)

  const { error } = await supabase.from('pagamentos_mesa').insert({
    estabelecimento_id: estabelecimentoId,
    mesa_id: mesaId,
    valor,
    desconto: desconto || 0,
    forma_pagamento: formaPagamento,
    nome_pagador: nomePagador?.trim() || null,
    caixa_sessao_id: sessaoAberta?.id || null,
    criado_por: user?.id || null,
  })

  if (error) throw new Error(error.message)
}

/**
 * Histórico de cada parcela paga por uma mesa dentro de uma sessão de
 * caixa específica — usado pelo detalhe expandido da lista de vendas
 * (clicar numa linha de "Pagamento" mostra todas as parcelas daquela mesa
 * naquela sessão, não só a que foi clicada).
 */
export async function listarPagamentosDaMesaNaSessao(
  mesaId: string,
  caixaSessaoId: string
): Promise<PagamentoMesa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pagamentos_mesa')
    .select('*')
    .eq('mesa_id', mesaId)
    .eq('caixa_sessao_id', caixaSessaoId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function fecharCaixa(sessaoId: string, valorInformado: number): Promise<SessaoCaixa> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessao, error: erroSessao } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('id', sessaoId)
    .single()
  if (erroSessao) throw erroSessao

  const resumo = await resumoSessao(sessaoId)
  // Dinheiro que deveria estar na gaveta: abertura + vendas + reforços
  // (suprimentos) - retiradas (sangrias) feitas ao longo do turno.
  const valorEsperado = sessao.valor_abertura + resumo.totalVendas + resumo.totalSuprimentos - resumo.totalSangrias

  const { data, error } = await supabase
    .from('caixa_sessoes')
    .update({
      status: 'fechado',
      valor_fechamento: valorInformado,
      valor_esperado: valorEsperado,
      diferenca: valorInformado - valorEsperado,
      fechado_por: user?.id,
      fechado_em: new Date().toISOString(),
    })
    .eq('id', sessaoId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function listarSessoes(estabelecimentoId: string): Promise<SessaoCaixa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('aberto_em', { ascending: false })
    .limit(30)

  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Chamada pelo módulo de pedidos quando um pedido é marcado como pago —
 * vincula o pedido à sessão de caixa aberta no momento (se houver).
 * Se não houver caixa aberto, o pedido simplesmente não fica associado a
 * nenhuma sessão (não bloqueia o fluxo do pedido).
 */
export async function vincularPedidoASessaoAberta(estabelecimentoId: string, pedidoId: string) {
  const sessaoAberta = await obterSessaoAberta(estabelecimentoId)
  if (!sessaoAberta) return

  const supabase = createClient()
  await supabase.from('orders').update({ caixa_sessao_id: sessaoAberta.id }).eq('id', pedidoId)
}

const numeroPedido = (id: string) => id.slice(0, 8).toUpperCase()

/**
 * Demonstrativo completo de uma sessão de caixa — vendas agrupadas por
 * mesa (cada grupo com seus pedidos e, logo abaixo, os pagamentos daquela
 * mesa), pedidos avulsos à parte, e total por forma de pagamento. Funciona
 * pra sessão aberta ou já fechada (os campos de fechamento simplesmente
 * ficam null enquanto ela está aberta).
 */
export async function demonstrativoSessao(sessaoId: string): Promise<DemonstrativoSessao> {
  const supabase = createClient()

  const { data: sessao, error: erroSessao } = await supabase
    .from('caixa_sessoes')
    .select('*')
    .eq('id', sessaoId)
    .single()
  if (erroSessao) throw new Error(erroSessao.message)

  const [{ data: pedidos, error: erroPedidos }, { data: pagamentos, error: erroPagamentos }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, metodo_pagamento, created_at, delivered_at, paid_at, mesa, mesa_id, staff_id')
      .eq('caixa_sessao_id', sessaoId)
      .eq('status', 'pago'),
    supabase
      .from('pagamentos_mesa')
      .select('id, valor, forma_pagamento, nome_pagador, created_at, mesa_id, criado_por, mesas(numero)')
      .eq('caixa_sessao_id', sessaoId),
  ])
  if (erroPedidos) throw new Error(erroPedidos.message)
  if (erroPagamentos) throw new Error(erroPagamentos.message)

  // Resolve nome de todo mundo envolvido (abertura/fechamento do caixa,
  // funcionário de cada pedido, funcionário de cada pagamento) numa
  // consulta só, em vez de uma por registro.
  const idsUsuarios = new Set<string>()
  if (sessao.aberto_por) idsUsuarios.add(sessao.aberto_por)
  if (sessao.fechado_por) idsUsuarios.add(sessao.fechado_por)
  for (const p of pedidos || []) if (p.staff_id) idsUsuarios.add(p.staff_id)
  for (const pg of pagamentos || []) if (pg.criado_por) idsUsuarios.add(pg.criado_por)

  const nomesPorId: Record<string, string> = {}
  if (idsUsuarios.size > 0) {
    const { data: perfis } = await supabase.from('profiles').select('id, nome, email').in('id', Array.from(idsUsuarios))
    for (const perfil of perfis || []) {
      nomesPorId[perfil.id] = perfil.nome || perfil.email || perfil.id
    }
  }

  const pedidosPorMesa = new Map<string, PedidoResumoDemonstrativo[]>()
  const pedidosAvulsos: PedidoResumoDemonstrativo[] = []
  const numeroMesaPorId = new Map<string, string>()

  for (const p of pedidos || []) {
    const item: PedidoResumoDemonstrativo = {
      id: p.id,
      numero: numeroPedido(p.id),
      criadoEm: p.created_at,
      entregueEm: p.delivered_at,
      pagoEm: p.paid_at,
      valor: p.total || 0,
      metodoPagamento: p.metodo_pagamento,
      funcionario: p.staff_id ? nomesPorId[p.staff_id] || null : null,
    }
    if (p.mesa_id) {
      if (!pedidosPorMesa.has(p.mesa_id)) pedidosPorMesa.set(p.mesa_id, [])
      pedidosPorMesa.get(p.mesa_id)!.push(item)
      if (p.mesa) numeroMesaPorId.set(p.mesa_id, p.mesa)
    } else {
      pedidosAvulsos.push(item)
    }
  }

  const pagamentosPorMesa = new Map<string, PagamentoResumoDemonstrativo[]>()
  for (const pg of pagamentos || []) {
    if (!pg.mesa_id) continue
    const item: PagamentoResumoDemonstrativo = {
      id: pg.id,
      horario: pg.created_at,
      valor: pg.valor || 0,
      nomePagador: pg.nome_pagador,
      formaPagamento: pg.forma_pagamento,
      funcionario: pg.criado_por ? nomesPorId[pg.criado_por] || null : null,
    }
    if (!pagamentosPorMesa.has(pg.mesa_id)) pagamentosPorMesa.set(pg.mesa_id, [])
    pagamentosPorMesa.get(pg.mesa_id)!.push(item)

    const mesaJoin = pg.mesas as unknown as { numero: string } | { numero: string }[] | null
    const numero = Array.isArray(mesaJoin) ? mesaJoin[0]?.numero : mesaJoin?.numero
    if (numero) numeroMesaPorId.set(pg.mesa_id, numero)
  }

  const todosMesaIds = new Set<string>([...pedidosPorMesa.keys(), ...pagamentosPorMesa.keys()])

  const gruposMesa: GrupoMesaDemonstrativo[] = Array.from(todosMesaIds)
    .map((mesaId) => {
      const pedidosDaMesa = (pedidosPorMesa.get(mesaId) || []).sort(
        (a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
      )
      const pagamentosDaMesa = (pagamentosPorMesa.get(mesaId) || []).sort(
        (a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime()
      )
      const totalPedidos = pedidosDaMesa.reduce((soma, p) => soma + p.valor, 0)
      const totalPagamentos = pagamentosDaMesa.reduce((soma, p) => soma + p.valor, 0)
      return {
        mesaId,
        numeroMesa: numeroMesaPorId.get(mesaId) || '?',
        pedidos: pedidosDaMesa,
        pagamentos: pagamentosDaMesa,
        totalPedidos,
        totalPagamentos,
        quitada: totalPagamentos >= totalPedidos,
      }
    })
    .sort((a, b) => a.numeroMesa.localeCompare(b.numeroMesa, undefined, { numeric: true }))

  const totalPorFormaPagamento: Record<string, number> = {}
  let totalGeral = 0

  for (const p of pedidosAvulsos) {
    totalGeral += p.valor
    const metodo = p.metodoPagamento || 'Não informado'
    totalPorFormaPagamento[metodo] = (totalPorFormaPagamento[metodo] || 0) + p.valor
  }
  for (const grupo of gruposMesa) {
    for (const pg of grupo.pagamentos) {
      totalGeral += pg.valor
      const metodo = pg.formaPagamento || 'Não informado'
      totalPorFormaPagamento[metodo] = (totalPorFormaPagamento[metodo] || 0) + pg.valor
    }
  }

  return {
    sessao,
    abertoPorNome: sessao.aberto_por ? nomesPorId[sessao.aberto_por] || null : null,
    fechadoPorNome: sessao.fechado_por ? nomesPorId[sessao.fechado_por] || null : null,
    gruposMesa,
    pedidosAvulsos: pedidosAvulsos.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()),
    totalPorFormaPagamento,
    totalGeral,
  }
}
