'use client'

import { use } from 'react'
import Link from 'next/link'
import AtendimentoInbox from '@/modules/whatsapp/AtendimentoInbox'

export default function AtendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/painel/estabelecimento/${id}/gerenciar`}
          className="text-sm text-neutral-500 hover:text-orange-600"
        >
          ← Voltar ao gerenciamento
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Atendimento — WhatsApp</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Histórico das conversas do robô e resposta manual quando ele estiver desligado ou precisar de um humano.
        </p>

        <div className="mt-4">
          <AtendimentoInbox estabelecimentoId={id} />
        </div>
      </div>
    </div>
  )
}
