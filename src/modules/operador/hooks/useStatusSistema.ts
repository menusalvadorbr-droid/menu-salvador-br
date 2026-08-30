'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type StatusSistema = 'online' | 'sem_conexao' | 'whatsapp_desconectado'

// Recheque de segurança — ver nota abaixo sobre por que existe apesar do
// canal Realtime já cobrir o caso comum.
const INTERVALO_RECHEQUE_MS = 45_000

/** Monitora dois sinais em paralelo pro indicador de status da Central do
 *  Operador:
 *
 *  1. Se o canal Realtime do Supabase está de fato inscrito (não só
 *     "tentando") — usa o próprio callback de status que `.subscribe()`
 *     já reporta (SUBSCRIBED/TIMED_OUT/CLOSED/CHANNEL_ERROR), sem inventar
 *     um mecanismo de "ping" à parte.
 *  2. O campo `estabelecimentos.whatsapp_status` — que já é setado
 *     sozinho, sem precisar de nenhum toque manual no dono, tanto pela IA
 *     (enviarComTratamentoDeErro em whatsappHandler.ts, dispara quando o
 *     token vence e a IA tenta responder um cliente) quanto por uma
 *     resposta manual do operador (responderConversaManualmente em
 *     atendimentoActions.ts) — ou por Configurações → WhatsApp, se
 *     alguém salvar uma conexão nova ou trocar o token ali.
 *
 *  O campo é escutado via Realtime pra refletir na hora, mas ISSO SÓ
 *  FUNCIONA SE a tabela `estabelecimentos` estiver na publicação Realtime
 *  do projeto no Supabase — diferente de whatsapp_conversas/orders/
 *  validacao_pedidos (já usadas por outros hooks deste módulo), nunca
 *  tinha existido necessidade de Realtime nessa tabela antes desta tela,
 *  então não dá pra presumir que já está habilitado. Por segurança, o
 *  hook também refaz a leitura sozinho a cada 45s (INTERVALO_RECHEQUE_MS)
 *  — assim o indicador acaba se atualizando de qualquer forma mesmo se
 *  esse Realtime específico não estiver ligado, só que com até 45s de
 *  atraso em vez de instantâneo. Ainda NÃO é um teste ativo contra a
 *  Cloud API da Meta (isso teria custo/rate-limit próprio e é um passo
 *  além do que foi pedido) — é só reler o último status que o banco já
 *  tem. */
export function useStatusSistema(estabelecimentoId: string) {
  const [realtimeConectado, setRealtimeConectado] = useState(true) // otimista até o 1º evento de status
  const [whatsappStatus, setWhatsappStatus] = useState<'conectado' | 'erro' | 'nao_conectado' | null>(null)
  const idCanalRef = useRef(crypto.randomUUID())

  useEffect(() => {
    const supabase = createClient()

    function buscarStatusAtual() {
      supabase
        .from('estabelecimentos')
        .select('whatsapp_status')
        .eq('id', estabelecimentoId)
        .single()
        .then(({ data }: { data: { whatsapp_status?: 'conectado' | 'erro' | 'nao_conectado' } | null }) => {
          setWhatsappStatus(data?.whatsapp_status || 'nao_conectado')
        })
    }

    buscarStatusAtual()
    const intervalo = setInterval(buscarStatusAtual, INTERVALO_RECHEQUE_MS)

    const canal = supabase
      .channel(`status-sistema-${estabelecimentoId}-${idCanalRef.current}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'estabelecimentos', filter: `id=eq.${estabelecimentoId}` },
        (payload: { new: { whatsapp_status?: 'conectado' | 'erro' | 'nao_conectado' } }) => {
          if (payload.new?.whatsapp_status) setWhatsappStatus(payload.new.whatsapp_status)
        }
      )
      .subscribe((status: string) => {
        setRealtimeConectado(status === 'SUBSCRIBED')
      })

    return () => {
      clearInterval(intervalo)
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId])

  const status: StatusSistema = !realtimeConectado
    ? 'sem_conexao'
    : whatsappStatus === 'conectado' || whatsappStatus === null // null = ainda carregando; não pisca vermelho à toa
      ? 'online'
      : 'whatsapp_desconectado'

  return { status }
}
