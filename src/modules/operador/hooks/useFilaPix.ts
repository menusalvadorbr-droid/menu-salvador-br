'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarPixPendentes } from '../operadorRepository'
import type { Pedido } from '../../pedidos/types'

export function useFilaPix(estabelecimentoId: string) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const dados = await listarPixPendentes(estabelecimentoId)
      setPedidos(dados)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  // Sufixo único por montagem — ver useFilaIA.ts pro motivo (nome fixo
  // colide entre montagens simultâneas do hook e quebra com "cannot add
  // postgres_changes callbacks... after subscribe()").
  const idCanalRef = useRef(crypto.randomUUID())

  useEffect(() => {
    carregar()
    // Realtime não filtra por metodo_pagamento (o filtro só aceita
    // igualdade numa coluna própria), então qualquer mudança em orders do
    // estabelecimento dispara refetch — mesmo comportamento que
    // usePedidosEstabelecimento.ts já tem hoje, não é regressão.
    const supabase = createClient()
    const canal = supabase
      .channel(`fila-pix-${estabelecimentoId}-${idCanalRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [estabelecimentoId, carregar])

  return { pedidos, carregando }
}
