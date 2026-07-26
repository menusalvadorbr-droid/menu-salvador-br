'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EditarEstabelecimentoForm from '../editar/EditarEstabelecimentoForm'
import GaleriaTab from '../editar/GaleriaTab'
import CardapioTab from '../editar/CardapioTab'
import HorariosEditor from '@/app/(dashboard)/painel/components/HorariosEditor'

interface OnboardingWizardProps {
  estabelecimento: any
  userId: string
}

const ETAPAS = [
  { id: 'dados', label: 'Dados da empresa', icone: '📋' },
  { id: 'fotos', label: 'Fotos', icone: '🖼️' },
  { id: 'cardapio', label: 'Cardápio', icone: '🍽️' },
  { id: 'horarios', label: 'Horários', icone: '🕒' },
] as const

export default function OnboardingWizard({ estabelecimento, userId }: OnboardingWizardProps) {
  const router = useRouter()
  const [etapaAtual, setEtapaAtual] = useState(0)

  const ultima = etapaAtual === ETAPAS.length - 1
  const primeira = etapaAtual === 0

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="text-xl">🕒</span>
          <span>
            Sua reivindicação está em análise. Enquanto isso, esta página fica{' '}
            <strong>oculta ao público</strong> — aproveite pra deixar tudo pronto. Assim que aprovarmos
            (em até 5 dias úteis), ela volta ao ar automaticamente, já completa.
          </span>
        </div>

        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Bem-vindo, vamos preparar {estabelecimento.nome_fantasia || estabelecimento.nome}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Preencha as etapas abaixo — tudo é salvo automaticamente, você pode voltar quando quiser.
        </p>

        {/* Indicador de etapas */}
        <div className="mb-6 flex items-center gap-2">
          {ETAPAS.map((etapa, i) => (
            <button
              key={etapa.id}
              onClick={() => setEtapaAtual(i)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition ${
                i === etapaAtual
                  ? 'bg-orange-100 text-orange-700'
                  : i < etapaAtual
                  ? 'bg-green-50 text-green-700'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              <span className="text-lg">{i < etapaAtual ? '✅' : etapa.icone}</span>
              {etapa.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {ETAPAS[etapaAtual].id === 'dados' && (
            <EditarEstabelecimentoForm estabelecimento={estabelecimento} podeEditar={true} userId={userId} />
          )}
          {ETAPAS[etapaAtual].id === 'fotos' && (
            <GaleriaTab estabelecimentoId={estabelecimento.id} readOnly={false} />
          )}
          {ETAPAS[etapaAtual].id === 'cardapio' && (
            <CardapioTab estabelecimentoId={estabelecimento.id} readOnly={false} />
          )}
          {ETAPAS[etapaAtual].id === 'horarios' && (
            <HorariosEditor estabelecimentoId={estabelecimento.id} readOnly={false} />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setEtapaAtual((e) => Math.max(0, e - 1))}
            disabled={primeira}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
          >
            ← Voltar
          </button>

          {!ultima ? (
            <button
              onClick={() => setEtapaAtual((e) => Math.min(ETAPAS.length - 1, e + 1))}
              className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Próxima etapa →
            </button>
          ) : (
            <button
              onClick={() => router.push(`/painel/estabelecimento/${estabelecimento.id}/gerenciar`)}
              className="rounded-lg bg-orange-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Concluir e ir para o painel completo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
