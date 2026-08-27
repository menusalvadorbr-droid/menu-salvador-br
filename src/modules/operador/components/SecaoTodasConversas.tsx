'use client'

import { useState } from 'react'
import { useTodasConversas } from '../hooks/useTodasConversas'
import CardConversa from './CardConversa'

/** Lista TODAS as conversas de WhatsApp, não só as pendentes — restaura a
 *  capacidade de navegar/revisar qualquer conversa (inclusive já
 *  resolvida) que existia na antiga AtendimentoInbox.tsx, removida junto
 *  com a rota /atendimento. Recolhida por padrão (pode ter muita
 *  conversa acumulada, diferente das outras seções que já são "pendência",
 *  naturalmente poucas de cada vez). */
export default function SecaoTodasConversas({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [aberto, setAberto] = useState(false)
  const { conversas, carregando } = useTodasConversas(estabelecimentoId)

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-neutral-800">
          💬 Todas as conversas <span className="font-normal text-neutral-500">({conversas.length})</span>
        </span>
        <span className={`text-neutral-400 transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {aberto && (
        <div className="border-t border-neutral-100 p-4 pt-3">
          {carregando ? (
            <p className="text-sm text-neutral-500">Carregando...</p>
          ) : conversas.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma conversa de WhatsApp ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {conversas.map((c) => (
                <CardConversa key={c.id} estabelecimentoId={estabelecimentoId} conversa={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
