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
      {/* Cabeçalho próprio dessa área — não reaproveita o CabecalhoGerenciar
          de propósito: essa tela é pensada como terminal de operação, não
          como página de conteúdo do painel, e não precisa combinar com o
          resto do produto. */}
      <header className="flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
            aria-label="Voltar"
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Terminal de caixa</p>
            <h1 className="truncate text-sm font-semibold text-white">{nomeEstabelecimento}</h1>
          </div>
        </div>

        <div className="flex shrink-0 gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
          <button
            onClick={() => setAba('caixa')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              aba === 'caixa' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Caixa atual
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              aba === 'historico' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Histórico
          </button>
        </div>
      </header>

      <div className="px-4 pt-3 md:px-6">
        <GestaoNav estabelecimentoId={id} tema="escuro" />
      </div>

      <div className="mx-auto max-w-5xl p-4 md:p-6">
        {aba === 'caixa' ? <PainelCaixa estabelecimentoId={id} /> : <HistoricoCaixa estabelecimentoId={id} />}
      </div>
    </div>
  )
}
