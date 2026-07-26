'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarMesas, criarMesa, atualizarStatusMesa, removerMesa } from '../mesasRepository'
import type { Mesa, StatusMesa } from '../types'

export function useMesas(estabelecimentoId: string) {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      setMesas(await listarMesas(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()

    // Reagir a mudanças de pedido também, já que o status da mesa depende
    // se existe pedido ativo vinculado a ela.
    const supabase = createClient()
    const canal = supabase
      .channel(`mesas-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mesas', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, carregar])

  async function adicionar(numero: string, capacidade?: number) {
    try {
      await criarMesa(estabelecimentoId, numero, capacidade)
      await carregar()
    } catch (err) {
      alert(`Não foi possível criar a mesa: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function mudarStatus(mesaId: string, status: StatusMesa) {
    const statusAnterior = mesas.find((m) => m.id === mesaId)?.status
    setMesas((prev) => prev.map((m) => (m.id === mesaId ? { ...m, status } : m)))
    try {
      await atualizarStatusMesa(mesaId, status)
    } catch (err) {
      setMesas((prev) => prev.map((m) => (m.id === mesaId ? { ...m, status: statusAnterior || m.status } : m)))
      alert(`Não foi possível atualizar a mesa: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function remover(mesaId: string) {
    const mesaRemovida = mesas.find((m) => m.id === mesaId)
    setMesas((prev) => prev.filter((m) => m.id !== mesaId))
    try {
      await removerMesa(mesaId)
    } catch (err) {
      if (mesaRemovida) setMesas((prev) => [...prev, mesaRemovida])
      alert(`Não foi possível remover a mesa: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return { mesas, carregando, adicionar, mudarStatus, remover }
}
