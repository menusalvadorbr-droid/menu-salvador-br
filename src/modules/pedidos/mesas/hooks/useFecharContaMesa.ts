'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarPedidosAbertosDaMesa, atualizarStatusPedido } from '../../ordersRepository'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import {
  vincularPedidoASessaoAberta,
  saldoPendenteDaMesa,
  registrarPagamentoParcial,
  obterSessaoAberta,
} from '@/modules/financeiro/caixaRepository'
import { atualizarStatusMesa } from '../mesasRepository'
import type { Pedido } from '../../types'
import type { Mesa } from '../types'

/** Resolve staff_id -> nome numa consulta só, mesmo padrão já usado no
 *  demonstrativo do Caixa (caixaRepository.ts) — importante quando o
 *  estabelecimento tem mais de um garçom, pra saber quem lançou cada
 *  pedido da mesa. */
async function resolverNomesFuncionarios(pedidos: Pedido[]): Promise<Record<string, string>> {
  const ids = Array.from(new Set(pedidos.map((p) => p.staff_id).filter((id): id is string => !!id)))
  if (ids.length === 0) return {}
  const supabase = createClient()
  const { data: perfis } = await supabase.from('profiles').select('id, nome, email').in('id', ids)
  const nomesPorId: Record<string, string> = {}
  for (const perfil of perfis || []) {
    nomesPorId[perfil.id] = perfil.nome || perfil.email || perfil.id
  }
  return nomesPorId
}

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
  const [nomesFuncionarios, setNomesFuncionarios] = useState<Record<string, string>>({})
  const [saldo, setSaldo] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Fechar conta grava um pagamento_mesa vinculado à sessão de caixa aberta
  // — sem sessão nenhuma, o pagamento entra órfão (caixa_sessao_id null),
  // some do relatório do turno e a mesa fecha sem esse dinheiro nunca
  // aparecer em nenhum fechamento de caixa. Por isso a ação exige sessão
  // aberta, não é só um detalhe de vínculo opcional.
  const [caixaAberto, setCaixaAberto] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const [listaPedidos, saldoInfo, sessaoAberta] = await Promise.all([
        listarPedidosAbertosDaMesa(mesa.id),
        saldoPendenteDaMesa(mesa.id),
        obterSessaoAberta(estabelecimentoId),
      ])
      setPedidos(listaPedidos)
      setSaldo(saldoInfo.saldo)
      setCaixaAberto(!!sessaoAberta)
      resolverNomesFuncionarios(listaPedidos).then(setNomesFuncionarios)
    } finally {
      setCarregando(false)
    }
  }, [mesa.id, estabelecimentoId])

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
            estabelecimentoId,
            pedido.items.map((item) => ({ itemCardapioId: item.id, quantidade: item.quantidade }))
          )
        } catch (err) {
          // Não trava o fechamento — mesmo comportamento do fluxo individual.
          console.error('Falha ao dar baixa no estoque ao fechar a conta da mesa:', err)
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
    if (!caixaAberto) {
      setErro('Abra o caixa antes de registrar um pagamento.')
      return { ok: false, contaFechada: false }
    }
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

  /**
   * "Fechar tudo agora", com desconto opcional — diferente de
   * registrarPagamento: aqui o valor cobrado já é o saldo menos o desconto,
   * e a conta fecha sempre (mesmo que o desconto zere o valor cobrado),
   * porque essa ação é explicitamente "encerrar a comanda agora", não mais
   * uma parcela que pode ou não completar o total.
   */
  async function fecharTudo(
    formaPagamento: string,
    nomePagador?: string,
    desconto = 0
  ): Promise<{ ok: boolean }> {
    if (!caixaAberto) {
      setErro('Abra o caixa antes de fechar a conta da mesa.')
      return { ok: false }
    }

    setEnviando(true)
    setErro(null)
    try {
      const valorACobrar = Math.max(0, saldo - desconto)
      await registrarPagamentoParcial(estabelecimentoId, mesa.id, valorACobrar, formaPagamento, nomePagador, desconto)
      await fecharPedidosPagos()
      return { ok: true }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fechar a conta')
      return { ok: false }
    } finally {
      setEnviando(false)
    }
  }

  return { pedidos, nomesFuncionarios, total, saldo, carregando, enviando, erro, caixaAberto, registrarPagamento, fecharTudo }
}
