'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  listarInsumos,
  criarInsumo,
  atualizarInsumo,
  ajustarEstoque,
  removerInsumo,
  listarTodosAlergenos,
  listarAlergenosDoInsumo,
  type DadosInsumo,
} from '../estoqueRepository'
import type { Insumo, Alergeno } from '../types'

export function useInsumos(estabelecimentoId: string) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [alergenos, setAlergenos] = useState<Alergeno[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const [listaInsumos, listaAlergenos] = await Promise.all([listarInsumos(estabelecimentoId), listarTodosAlergenos()])
      setInsumos(listaInsumos)
      setAlergenos(listaAlergenos)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()

    const supabase = createClient()
    const canal = supabase
      .channel(`insumos-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insumos', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, carregar])

  async function adicionar(dados: DadosInsumo) {
    try {
      await criarInsumo(estabelecimentoId, dados)
      await carregar()
    } catch (err) {
      alert(`Não foi possível criar o insumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function atualizar(insumoId: string, dados: DadosInsumo) {
    try {
      await atualizarInsumo(insumoId, dados)
      await carregar()
    } catch (err) {
      alert(`Não foi possível atualizar o insumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function ajustar(insumoId: string, novaQuantidade: number) {
    const anterior = insumos.find((i) => i.id === insumoId)?.estoque_atual
    setInsumos((prev) => prev.map((i) => (i.id === insumoId ? { ...i, estoque_atual: novaQuantidade } : i)))
    try {
      await ajustarEstoque(insumoId, novaQuantidade)
    } catch (err) {
      setInsumos((prev) => prev.map((i) => (i.id === insumoId ? { ...i, estoque_atual: anterior ?? i.estoque_atual } : i)))
      alert(`Não foi possível ajustar o estoque: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function remover(insumoId: string) {
    const insumoRemovido = insumos.find((i) => i.id === insumoId)
    setInsumos((prev) => prev.filter((i) => i.id !== insumoId))
    try {
      await removerInsumo(insumoId)
    } catch (err) {
      if (insumoRemovido) setInsumos((prev) => [...prev, insumoRemovido])
      alert(`Não foi possível remover o insumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  const emFalta = insumos.filter((i) => i.estoque_atual <= i.estoque_minimo)

  return { insumos, alergenos, carregando, emFalta, adicionar, atualizar, ajustar, remover, listarAlergenosDoInsumo }
}
