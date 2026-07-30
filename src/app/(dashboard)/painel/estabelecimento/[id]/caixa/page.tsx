'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import PainelCaixa from '@/modules/financeiro/components/PainelCaixa'
import HistoricoCaixa from '@/modules/financeiro/components/HistoricoCaixa'
import EstadoCarregamento from '../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../gerenciar/useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../gerenciar/CabecalhoGerenciar'

export default function CaixaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [aba, setAba] = useState<'caixa' | 'historico'>('caixa')
  const [contaAberta, setContaAberta] = useState(false)
  const {
    estabelecimento,
    usuarioNome,
    usuarioLogadoId,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
  } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <CabecalhoGerenciar
          estabelecimento={estabelecimento}
          usuarioNome={usuarioNome}
          usuarioLogadoId={usuarioLogadoId}
          ehDonoOuGerente={ehDonoOuGerente}
          podeEditar={podeEditar}
          aoVoltar={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
          tituloPagina={{ icone: '💰', texto: 'Caixa' }}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        <div className="flex gap-2">
          <button
            onClick={() => setAba('caixa')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              aba === 'caixa' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Caixa atual
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              aba === 'historico' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
