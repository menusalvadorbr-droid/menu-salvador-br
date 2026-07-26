'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarPedidosDoEstabelecimento, atualizarStatusPedido } from '../ordersRepository'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import { vincularPedidoASessaoAberta } from '@/modules/financeiro/caixaRepository'
import type { Pedido, StatusPedido } from '../types'

export function usePedidosEstabelecimento(estabelecimentoId: string) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const dados = await listarPedidosDoEstabelecimento(estabelecimentoId)
      setPedidos(dados)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()

    // Realtime: atualiza a lista sozinha quando um pedido novo chega ou muda de status,
    // sem precisar a equipe ficar apertando F5.
    const supabase = createClient()
    const canal = supabase
      .channel(`pedidos-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, carregar])

  const mudarStatus = useCallback(
    async (pedidoId: string, novoStatus: StatusPedido) => {
      const pedidoAtual = pedidos.find((p) => p.id === pedidoId)

      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p)))

      try {
        await atualizarStatusPedido(pedidoId, novoStatus)
      } catch (err) {
        // Reverte a atualização otimista e avisa — melhor que deixar a
        // exceção subir sem tratamento (o que gera um erro genérico
        // "[object Object]" no overlay do Next.js).
        setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status: pedidoAtual?.status || p.status } : p)))
        alert(
          `Não foi possível atualizar o status do pedido: ${
            err instanceof Error ? err.message : 'erro desconhecido'
          }`
        )
        return
      }

      // Baixa de estoque: só dispara na transição PARA "em_preparo", nunca
      // de novo se o status já era esse (evita descontar duas vezes o
      // mesmo pedido). Itens sem receita cadastrada são ignorados sozinhos
      // pelo módulo de estoque — não trava o fluxo do pedido.
      if (novoStatus === 'em_preparo' && pedidoAtual?.status !== 'em_preparo') {
        try {
          await baixarEstoquePorItens(
            (pedidoAtual?.items || []).map((item) => ({
              itemCardapioId: item.id,
              quantidade: item.quantidade,
            }))
          )
        } catch {
          // Falha ao dar baixa não deve travar o andamento do pedido —
          // o estoque pode ser ajustado manualmente depois se precisar.
        }
      }

      // Vincula o pedido à sessão de caixa aberta, se houver uma.
      if (novoStatus === 'pago' && pedidoAtual?.status !== 'pago') {
        try {
          await vincularPedidoASessaoAberta(estabelecimentoId, pedidoId)
        } catch {
          // Sem caixa aberto ou falha ao vincular não deve travar o pedido —
          // o relatório do caixa pode ficar sem esse pedido, ajustável depois.
        }
      }
    },
    [pedidos, estabelecimentoId]
  )

  return { pedidos, carregando, mudarStatus }
}
