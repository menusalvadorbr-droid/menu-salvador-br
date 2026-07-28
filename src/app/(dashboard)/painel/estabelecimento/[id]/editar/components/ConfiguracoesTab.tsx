'use client'

import { useState } from 'react'
import HorariosEditor from '@/app/(dashboard)/painel/components/HorariosEditor'
import ComodidadesTab from './ComodidadesTab'
import GoogleReviewsTab from './GoogleReviewsTab'
import CardapioRecursosTab from './CardapioRecursosTab'
import GaleriaTab from '../GaleriaTab'
import IdiomasTab from './IdiomasTab'

interface ConfiguracoesTabProps {
  estabelecimento: {
    id: string
    google_place_id: string | null
    cardapio_variacoes_ativado?: boolean
    cardapio_complementos_ativado?: boolean
    [key: string]: any
  }
  readOnly?: boolean
}

const SECOES = [
  { id: 'horarios', label: '🕒 Horários' },
  { id: 'galeria', label: '🖼️ Galeria' },
  { id: 'comodidades', label: '✨ Comodidades' },
  { id: 'avaliacoes', label: '⭐ Avaliações Google' },
  { id: 'idiomas', label: '🌐 Idiomas' },
  { id: 'cardapio-recursos', label: '🍽️ Recursos do cardápio' },
] as const

export default function ConfiguracoesTab({ estabelecimento, readOnly }: ConfiguracoesTabProps) {
  const [secaoAtiva, setSecaoAtiva] = useState<string>('horarios')

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Menu lateral das sub-seções */}
      <div className="flex gap-1 overflow-x-auto md:w-48 md:flex-none md:flex-col md:overflow-visible">
        {SECOES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSecaoAtiva(s.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition whitespace-nowrap md:whitespace-normal ${
              secaoAtiva === s.id ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-seção selecionada */}
      <div className="flex-1 min-w-0">
        {secaoAtiva === 'horarios' && (
          <HorariosEditor estabelecimentoId={estabelecimento.id} readOnly={readOnly} />
        )}
        {secaoAtiva === 'galeria' && (
          <GaleriaTab estabelecimentoId={estabelecimento.id} readOnly={readOnly} />
        )}
        {secaoAtiva === 'comodidades' && (
          <ComodidadesTab estabelecimento={estabelecimento} />
        )}
        {secaoAtiva === 'avaliacoes' && (
          <GoogleReviewsTab
            estabelecimentoId={estabelecimento.id}
            placeIdAtual={estabelecimento.google_place_id || null}
          />
        )}
        {secaoAtiva === 'idiomas' && (
          <IdiomasTab estabelecimento={estabelecimento} />
        )}
        {secaoAtiva === 'cardapio-recursos' && (
          <CardapioRecursosTab estabelecimento={estabelecimento} readOnly={readOnly} />
        )}
      </div>
    </div>
  )
}
