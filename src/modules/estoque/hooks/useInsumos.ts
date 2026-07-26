'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarInsumos, criarInsumo, ajustarEstoque, removerInsumo } from '../estoqueRepository'
import type { Insumo, UnidadeInsumo } from '../types'

export function useInsumos(estabelecimentoId: string) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      setInsumos(await listarInsumos(estabelecimentoId))
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

  async function adicionar(nome: string, unidade: UnidadeInsumo, estoqueAtual: number, estoqueMinimo: number) {
    try {
      await criarInsumo(estabelecimentoId, nome, unidade, estoqueAtual, estoqueMinimo)
      await carregar()
    } catch (err) {
      alert(`Não foi possível criar o insumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
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

  return { insumos, carregando, emFalta, adicionar, ajustar, remover }
}
