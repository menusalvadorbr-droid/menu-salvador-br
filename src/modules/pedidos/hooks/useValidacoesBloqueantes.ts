'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ValidacaoBloqueante {
  id: string
  status: 'pendente' | 'recusado'
  motivo_recusa: string | null
}

/** Pedidos de entrega ainda não liberados pra cozinha — usado pelo board de
 *  comandas (PainelComandas.tsx) pra bloquear a transição aprovado→em_preparo
 *  até a Fila do Operador (Seção "Validar entrega") aceitar. Fica de fora de
 *  usePedidosEstabelecimento.ts de propósito — esse hook é consumido também
 *  por useFecharContaMesa.ts, não vale a pena arriscar ali por uma
 *  necessidade específica do board. */
export function useValidacoesBloqueantes(estabelecimentoId: string) {
  const [bloqueantes, setBloqueantes] = useState<Map<string, ValidacaoBloqueante>>(new Map())

  const carregar = useCallback(() => {
    const supabase = createClient()
    supabase
      .from('validacao_pedidos')
      .select('id, pedido_id, status, motivo_recusa')
      .eq('estabelecimento_id', estabelecimentoId)
      .in('status', ['pendente', 'recusado'])
      .then(({ data }) => {
        const mapa = new Map<string, ValidacaoBloqueante>()
        for (const linha of data || []) {
          mapa.set(linha.pedido_id, { id: linha.id, status: linha.status, motivo_recusa: linha.motivo_recusa })
        }
        setBloqueantes(mapa)
      })
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
    const supabase = createClient()
    const canal = supabase
      .channel(`validacoes-bloqueantes-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'validacao_pedidos', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [estabelecimentoId, carregar])

  return bloqueantes
}
