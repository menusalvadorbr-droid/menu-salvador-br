'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConversaFilaIA } from '../types'

/** Mesma query que a antiga AtendimentoInbox.tsx usava — todas as
 *  conversas, não só as com precisa_humano=true (essa parte é useFilaIA).
 *  Existe pra não perder a capacidade de navegar/revisar qualquer conversa
 *  (inclusive já resolvida) depois que a rota /atendimento foi removida. */
export function useTodasConversas(estabelecimentoId: string) {
  const [conversas, setConversas] = useState<ConversaFilaIA[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('whatsapp_conversas')
        .select('id, telefone, mensagens, precisa_humano, ultima_interacao_em')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('precisa_humano', { ascending: false })
        .order('ultima_interacao_em', { ascending: false })

      const normalizado = (data || []).map((c) => ({
        ...c,
        mensagens: Array.isArray(c.mensagens) ? c.mensagens : [],
      })) as ConversaFilaIA[]
      setConversas(normalizado)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
    const supabase = createClient()
    const canal = supabase
      .channel(`todas-conversas-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversas', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [estabelecimentoId, carregar])

  return { conversas, carregando }
}
