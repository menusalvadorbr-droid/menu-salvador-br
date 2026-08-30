'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConversaFilaIA } from '../types'

/** Mesma query de AtendimentoInbox.tsx (whatsapp_conversas, filtro
 *  precisa_humano=true) — duplicada aqui de propósito, não extraída: o
 *  projeto já copia esse padrão de hook+realtime por feature em vários
 *  lugares (usePedidosEstabelecimento, useInsumos, useMovimentos etc.),
 *  extrair agora seria inconsistente com a convenção e um risco
 *  desnecessário em AtendimentoInbox.tsx pra um ganho pequeno. */
export function useFilaIA(estabelecimentoId: string) {
  const [conversas, setConversas] = useState<ConversaFilaIA[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('whatsapp_conversas')
        .select('id, telefone, mensagens, precisa_humano, ultima_interacao_em')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('precisa_humano', true)
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

  // Sufixo único por montagem — o nome do canal não precisa ter
  // significado, só precisa ser único no registro do client Supabase.
  // Com o nome fixo (só estabelecimentoId), duas montagens simultâneas
  // deste hook (StrictMode em dev, ou trocar de tela antes do cleanup da
  // anterior terminar) podiam pegar o MESMO objeto de canal já inscrito e
  // quebrar com "cannot add postgres_changes callbacks... after
  // subscribe()". O filtro (que decide quais linhas chegam) continua
  // igual — só o rótulo do canal muda.
  const idCanalRef = useRef(crypto.randomUUID())

  useEffect(() => {
    carregar()
    const supabase = createClient()
    const canal = supabase
      .channel(`fila-ia-${estabelecimentoId}-${idCanalRef.current}`)
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
