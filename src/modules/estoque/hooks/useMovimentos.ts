'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarMovimentos, lancarMovimento, type DadosMovimento } from '../movimentosRepository'
import type { MovimentoEstoque } from '../types'

export function useMovimentos(estabelecimentoId: string) {
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setMovimentos(await listarMovimentos(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()

    const supabase = createClient()
    const canal = supabase
      .channel(`movimentos-estoque-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movimentos_estoque', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, carregar])

  async function lancar(dados: DadosMovimento) {
    setErro(null)
    try {
      await lancarMovimento(estabelecimentoId, dados)
      await carregar()
      return true
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível lançar o movimento.')
      return false
    }
  }

  return { movimentos, carregando, erro, lancar }
}
