'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PedidoAcompanhamento } from '../types'

/** Mesmo padrão de Realtime já usado no cardápio (postgres_changes com
 *  filtro), aqui inscrito só na linha desse pedido específico — refaz a
 *  leitura completa a cada evento (em vez de confiar em `payload.new`),
 *  mesma escolha já feita em usePedidosEstabelecimento.ts. */
export function useAcompanharPedido(pedidoId: string) {
  const [pedido, setPedido] = useState<PedidoAcompanhamento | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  const carregar = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('pedidos_acompanhamento')
        .select('*')
        .eq('id', pedidoId)
        .maybeSingle()

      if (data) setPedido(data as PedidoAcompanhamento)
      else setNaoEncontrado(true)
    } finally {
      setCarregando(false)
    }
  }, [pedidoId])

  useEffect(() => {
    carregar()

    const supabase = createClient()
    const canal = supabase
      .channel(`pedido-acompanhamento-${pedidoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos_acompanhamento', filter: `id=eq.${pedidoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [pedidoId, carregar])

  return { pedido, carregando, naoEncontrado }
}
