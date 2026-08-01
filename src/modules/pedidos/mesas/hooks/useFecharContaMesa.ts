'use client'

import { useCallback, useEffect, useState } from 'react'
import { listarPedidosAbertosDaMesa, atualizarStatusPedido } from '../../ordersRepository'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import { vincularPedidoASessaoAberta, saldoPendenteDaMesa, registrarPagamentoParcial } from '@/modules/financeiro/caixaRepository'
import { atualizarStatusMesa } from '../mesasRepository'
import type { Pedido } from '../../types'
import type { Mesa } from '../types'

/**
 * Fecha a conta de uma mesa — de uma vez só ou em pagamentos parciais.
 * Cada pagamento (parcial ou o que cobre o resto de uma vez) vira uma linha
 * em pagamentos_mesa; os pedidos só viram 'pago' quando a soma dos
 * pagamentos cobrir o total em aberto — reaproveita a mesma baixa de
 * estoque e vínculo com o caixa que já rodam pedido a pedido em
 * PainelComandas (usePedidosEstabelecimento.ts), só que em lote.
 */
export function useFecharContaMesa(mesa: Mesa, estabelecimentoId: string) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [saldo, setSaldo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const [listaPedidos, saldoInfo] = await Promise.all([
        listarPedidosAbertosDaMesa(mesa.id),
        saldoPendenteDaMesa(mesa.id),
      ])
      setPedidos(listaPedidos)
      setSaldo(saldoInfo.saldo)
    } finally {
      setCarregando(false)
    }
  }, [mesa.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  const total = pedidos.reduce((soma, p) => soma + p.total, 0)

  async function fecharPedidosPagos() {
    for (const pedido of pedidos) {
      // Mesma regra de idempotência do fluxo individual: a baixa de
      // estoque só acontece na transição pra "em_preparo". Se o pedido
      // ainda estava antes disso (recebido/aprovado), essa baixa nunca
      // rodou — fazemos agora, uma única vez, antes de marcar como pago.
      if (pedido.status === 'recebido' || pedido.status === 'aprovado') {
        try {
          await baixarEstoquePorItens(
            pedido.items.map((item) => ({ itemCardapioId: item.id, quantidade: item.quantidade }))
          )
        } catch {
          // Não trava o fechamento — mesmo comportamento do fluxo individual.
        }
      }

      await atualizarStatusPedido(pedido.id, 'pago')

      try {
        await vincularPedidoASessaoAberta(estabelecimentoId, pedido.id)
      } catch {
        // Sem caixa aberto não deve travar o fechamento da conta.
      }
    }

    if (mesa.status === 'ocupada') {
      await atualizarStatusMesa(mesa.id, 'livre')
    }

    setPedidos([])
    setSaldo(0)
  }

  async function registrarPagamento(
    valor: number,
    formaPagamento: string,
    nomePagador?: string
  ): Promise<{ ok: boolean; contaFechada: boolean }> {
    if (!(valor > 0)) {
      setErro('Informe um valor maior que zero.')
      return { ok: false, contaFechada: false }
    }

    setEnviando(true)
    setErro(null)
    try {
      await registrarPagamentoParcial(estabelecimentoId, mesa.id, valor, formaPagamento, nomePagador)
      const saldoInfo = await saldoPendenteDaMesa(mesa.id)
      setSaldo(saldoInfo.saldo)

      if (saldoInfo.saldo <= 0) {
        await fecharPedidosPagos()
        return { ok: true, contaFechada: true }
      }
      return { ok: true, contaFechada: false }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao registrar o pagamento')
      return { ok: false, contaFechada: false }
    } finally {
      setEnviando(false)
    }
  }

  return { pedidos, total, saldo, carregando, enviando, erro, registrarPagamento }
}
