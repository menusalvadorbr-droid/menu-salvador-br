'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  listarPedidosCompra,
  criarPedidoCompra,
  marcarPedidoComoRecebido,
  cancelarPedidoCompra,
} from '../fornecedoresRepository'
import type { PedidoCompra, NovoItemPedidoCompra } from '../types'

export function usePedidosCompra(estabelecimentoId: string) {
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(false)

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidosCompra(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar(fornecedorId: string | null, itens: NovoItemPedidoCompra[], observacoes?: string) {
    try {
      await criarPedidoCompra(estabelecimentoId, fornecedorId, itens, observacoes)
      await carregar()
      return true
    } catch (err) {
      alert(`Não foi possível criar o pedido de compra: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      return false
    }
  }

  async function receber(pedidoId: string) {
    setProcessando(true)
    try {
      await marcarPedidoComoRecebido(pedidoId)
      await carregar()
    } catch (err) {
      alert(`Não foi possível confirmar o recebimento: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setProcessando(false)
    }
  }

  async function cancelar(pedidoId: string) {
    const anterior = pedidos
    setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? { ...p, status: 'cancelado' } : p)))
    try {
      await cancelarPedidoCompra(pedidoId)
    } catch (err) {
      setPedidos(anterior)
      alert(`Não foi possível cancelar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return { pedidos, carregando, processando, criar, receber, cancelar }
}
