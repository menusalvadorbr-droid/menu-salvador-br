'use client'

import { useState } from 'react'
import { useFilaIA } from '../hooks/useFilaIA'
import { responderConversaManualmente, marcarConversaResolvida } from '@/modules/whatsapp/atendimentoActions'
import type { ConversaFilaIA } from '../types'

function haQuantoTempo(iso: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  return `há ${Math.floor(horas / 24)}d`
}

function CardConversa({
  estabelecimentoId,
  conversa,
}: {
  estabelecimentoId: string
  conversa: ConversaFilaIA
}) {
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const ultima = conversa.mensagens[conversa.mensagens.length - 1]

  async function enviar() {
    if (!resposta.trim() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await responderConversaManualmente(estabelecimentoId, conversa.id, resposta.trim())
      setResposta('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar.')
    }
    setEnviando(false)
  }

  async function resolver() {
    setEnviando(true)
    try {
      await marcarConversaResolvida(estabelecimentoId, conversa.id)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao marcar como resolvido.')
    }
    setEnviando(false)
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-neutral-800">{conversa.telefone}</span>
        <span className="text-xs text-neutral-400">{haQuantoTempo(conversa.ultima_interacao_em)}</span>
      </div>

      {mostrarHistorico ? (
        <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto rounded-lg bg-neutral-50 p-2">
          {conversa.mensagens.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-2.5 py-1.5 text-xs ${
                m.role === 'user' ? 'ml-auto bg-orange-500 text-white' : 'mr-auto bg-neutral-200 text-neutral-800'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      ) : (
        ultima && <p className="mt-0.5 truncate text-xs text-neutral-500">{ultima.content}</p>
      )}

      <button
        onClick={() => setMostrarHistorico((v) => !v)}
        className="mt-1 text-xs font-medium text-amber-700 underline"
      >
        {mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico completo'}
      </button>

      <div className="mt-2 flex gap-2">
        <input
          value={resposta}
          onChange={(e) => setResposta(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
          placeholder="Responder manualmente..."
          className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs"
        />
        <button
          onClick={enviar}
          disabled={enviando || !resposta.trim()}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
        <button
          onClick={resolver}
          disabled={enviando}
          className="shrink-0 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
        >
          Marcar como resolvido
        </button>
      </div>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}

export default function SecaoIAPrecisaDeVoce({
  estabelecimentoId,
  mostrarTitulo = true,
}: {
  estabelecimentoId: string
  mostrarTitulo?: boolean
}) {
  const { conversas, carregando } = useFilaIA(estabelecimentoId)

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      {mostrarTitulo && (
        <h2 className="mb-3 text-sm font-bold text-amber-800">
          🤖 IA precisa de você <span className="font-normal text-amber-600">({conversas.length})</span>
        </h2>
      )}
      {carregando ? (
        <p className="text-sm text-amber-600">Carregando...</p>
      ) : conversas.length === 0 ? (
        <p className="text-sm text-amber-600">Nenhuma conversa esperando atendimento.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversas.map((c) => (
            // Sem callback de refetch: a lista já é Realtime (useFilaIA
            // escuta whatsapp_conversas), então responder e resolver
            // atualizam a UI sozinhos assim que o banco muda.
            <CardConversa key={c.id} estabelecimentoId={estabelecimentoId} conversa={c} />
          ))}
        </div>
      )}
    </section>
  )
}
