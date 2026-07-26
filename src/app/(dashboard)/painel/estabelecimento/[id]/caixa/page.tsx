'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import PainelCaixa from '@/modules/financeiro/components/PainelCaixa'
import HistoricoCaixa from '@/modules/financeiro/components/HistoricoCaixa'

export default function CaixaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aba, setAba] = useState<'caixa' | 'historico'>('caixa')

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/painel/estabelecimento/${id}/gerenciar`}
          className="text-sm text-neutral-500 hover:text-orange-600"
        >
          ← Voltar ao gerenciamento
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Caixa</h1>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAba('caixa')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'caixa' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Caixa atual
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'historico' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Histórico
          </button>
        </div>

        <div className="mt-6">
          {aba === 'caixa' ? (
            <PainelCaixa estabelecimentoId={id} />
          ) : (
            <HistoricoCaixa estabelecimentoId={id} />
          )}
        </div>
      </div>
    </div>
  )
}
