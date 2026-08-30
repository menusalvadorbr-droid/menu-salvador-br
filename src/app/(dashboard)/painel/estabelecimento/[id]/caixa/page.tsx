'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PainelCaixa from '@/modules/financeiro/components/PainelCaixa'
import HistoricoCaixa from '@/modules/financeiro/components/HistoricoCaixa'
import EstadoCarregamento from '../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../gerenciar/useEstabelecimentoGerenciar'
import { caixaTema } from '@/modules/financeiro/caixaTema'
import GestaoNav from '../gerenciar/GestaoNav'

export default function CaixaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [aba, setAba] = useState<'caixa' | 'historico'>('caixa')
  const { estabelecimento, loading, acessoNegado } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  const nomeEstabelecimento = estabelecimento.nome_fantasia || estabelecimento.nome

  return (
    <div className={`min-h-screen ${caixaTema.pagina}`}>
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        {/* Mesma paleta e estrutura de cabeçalho que o resto do painel de
            Gestão usa (ver operador/page.tsx) — antes essa área era
            deliberadamente escura e desacoplada; a paleta foi unificada. */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
              aria-label="Voltar"
              className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Terminal de caixa</p>
              <h1 className="truncate text-sm font-semibold text-neutral-900">{nomeEstabelecimento}</h1>
            </div>
          </div>

          <div className="flex shrink-0 gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            <button
              onClick={() => setAba('caixa')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                aba === 'caixa' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Caixa atual
            </button>
            <button
              onClick={() => setAba('historico')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                aba === 'historico' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        <GestaoNav estabelecimentoId={id} />

        <div className="mt-6">
          {aba === 'caixa' ? <PainelCaixa estabelecimentoId={id} /> : <HistoricoCaixa estabelecimentoId={id} />}
        </div>
      </div>
    </div>
  )
}
