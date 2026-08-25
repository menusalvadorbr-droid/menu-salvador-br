'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { responderConversaManualmente, marcarConversaResolvida } from './atendimentoActions'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Conversa {
  id: string
  telefone: string
  mensagens: Mensagem[]
  precisa_humano: boolean
  ultima_interacao_em: string
}

interface AtendimentoInboxProps {
  estabelecimentoId: string
}

/**
 * Inbox simples das conversas de WhatsApp — pra quem trabalha no balcão
 * ver o histórico e responder manualmente sem abrir o WhatsApp do celular
 * da loja. Cobre principalmente os dois casos em que o robô não responde
 * sozinho: robô desligado, ou conversa marcada "precisa humano" (cliente
 * pediu atendente, ou a IA falhou).
 */
export default function AtendimentoInbox({ estabelecimentoId }: AtendimentoInboxProps) {
  const supabase = createClient()

  const [conversas, setConversas] = useState<Conversa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregar()
    // Realtime já é padrão estabelecido no projeto pra esse tipo de lista
    // ao vivo (mesmo princípio do cardápio público) — sem isso, quem
    // estiver com o inbox aberto só veria mensagem nova recarregando a
    // página.
    const canal = supabase
      .channel(`whatsapp_conversas_${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversas', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()
    return () => { supabase.removeChannel(canal) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId])

  async function carregar() {
    const { data } = await supabase
      .from('whatsapp_conversas')
      .select('id, telefone, mensagens, precisa_humano, ultima_interacao_em')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('precisa_humano', { ascending: false })
      .order('ultima_interacao_em', { ascending: false })

    // `mensagens` nunca deveria vir nulo (default '[]'::jsonb no banco,
    // sempre gravado como array em whatsappHandler.ts), mas normaliza aqui
    // de qualquer forma — o resto do componente indexa/mapeia isso sem
    // checagem, e um valor inesperado quebraria a renderização inteira em
    // vez de só essa conversa.
    const normalizado = (data || []).map((c) => ({
      ...c,
      mensagens: Array.isArray(c.mensagens) ? c.mensagens : [],
    })) as Conversa[]
    setConversas(normalizado)
    setCarregando(false)
  }

  const selecionada = conversas.find((c) => c.id === selecionadaId) || null

  async function enviar() {
    if (!selecionada || !resposta.trim() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await responderConversaManualmente(estabelecimentoId, selecionada.id, resposta.trim())
      setResposta('')
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar.')
    }
    setEnviando(false)
  }

  async function resolver(conversaId: string) {
    try {
      await marcarConversaResolvida(estabelecimentoId, conversaId)
      await carregar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao marcar como resolvido.')
    }
  }

  if (carregando) {
    return <p className="text-sm text-neutral-400">Carregando conversas...</p>
  }

  if (conversas.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-sm text-neutral-400 shadow-sm">
        Nenhuma conversa de WhatsApp ainda.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Lista */}
      <div className="flex flex-col gap-1.5 md:w-72 md:flex-none">
        {conversas.map((c) => {
          const ultima = c.mensagens[c.mensagens.length - 1]
          return (
            <button
              key={c.id}
              onClick={() => setSelecionadaId(c.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selecionadaId === c.id
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-neutral-100 bg-white hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-800">{c.telefone}</span>
                {c.precisa_humano && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    PRECISA HUMANO
                  </span>
                )}
              </div>
              {ultima && <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{ultima.content}</p>}
            </button>
          )
        })}
      </div>

      {/* Conversa selecionada */}
      <div className="flex-1 min-w-0">
        {!selecionada ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-neutral-100 bg-white text-sm text-neutral-400">
            Selecione uma conversa
          </div>
        ) : (
          <div className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 p-4">
              <p className="text-sm font-semibold text-neutral-800">{selecionada.telefone}</p>
              {selecionada.precisa_humano && (
                <button
                  onClick={() => resolver(selecionada.id)}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Marcar como resolvido
                </button>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: '50vh' }}>
              {selecionada.mensagens.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user' ? 'ml-auto bg-orange-500 text-white' : 'mr-auto bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-neutral-100 p-3">
              <input
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
                placeholder="Responder manualmente..."
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
              <button
                onClick={enviar}
                disabled={enviando || !resposta.trim()}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            {erro && <p className="px-3 pb-2 text-xs text-red-600">{erro}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
