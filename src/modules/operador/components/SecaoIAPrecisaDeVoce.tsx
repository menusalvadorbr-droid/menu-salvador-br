'use client'

import { useFilaIA } from '../hooks/useFilaIA'
import CardConversa from './CardConversa'

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
            <CardConversa key={c.id} estabelecimentoId={estabelecimentoId} conversa={c} />
          ))}
        </div>
      )}
    </section>
  )
}
