'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarValidacoesPendentes } from '../operadorRepository'
import type { ValidacaoPedido } from '../types'

export function useFilaValidacao(estabelecimentoId: string) {
  const [validacoes, setValidacoes] = useState<ValidacaoPedido[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const dados = await listarValidacoesPendentes(estabelecimentoId)
      setValidacoes(dados)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
    const supabase = createClient()
    const canal = supabase
      .channel(`fila-validacao-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'validacao_pedidos', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [estabelecimentoId, carregar])

  return { validacoes, carregando, recarregar: carregar }
}
