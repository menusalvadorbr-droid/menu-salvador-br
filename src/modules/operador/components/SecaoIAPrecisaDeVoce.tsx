'use client'

import Link from 'next/link'
import { useFilaIA } from '../hooks/useFilaIA'

function haQuantoTempo(iso: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas}h`
  return `há ${Math.floor(horas / 24)}d`
}

export default function SecaoIAPrecisaDeVoce({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { conversas, carregando } = useFilaIA(estabelecimentoId)

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-amber-800">
        🤖 IA precisa de você <span className="font-normal text-amber-600">({conversas.length})</span>
      </h2>
      {carregando ? (
        <p className="text-sm text-amber-600">Carregando...</p>
      ) : conversas.length === 0 ? (
        <p className="text-sm text-amber-600">Nenhuma conversa esperando atendimento.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversas.map((c) => {
            const ultima = c.mensagens[c.mensagens.length - 1]
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-800">{c.telefone}</span>
                    <span className="text-xs text-neutral-400">{haQuantoTempo(c.ultima_interacao_em)}</span>
                  </div>
                  {ultima && <p className="mt-0.5 truncate text-xs text-neutral-500">{ultima.content}</p>}
                </div>
                <Link
                  href={`/painel/estabelecimento/${estabelecimentoId}/atendimento`}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Responder
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
