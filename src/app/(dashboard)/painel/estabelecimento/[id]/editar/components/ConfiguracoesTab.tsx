'use client'

import { useState } from 'react'
import { Clock, Image, Sparkles, Star, Globe, SlidersHorizontal, Wrench, Users, MessageCircle, Wallet } from 'lucide-react'
import HorariosEditor from '@/app/(dashboard)/painel/components/HorariosEditor'
import ComodidadesTab from './ComodidadesTab'
import GoogleReviewsTab from './GoogleReviewsTab'
import CardapioRecursosTab from './CardapioRecursosTab'
import GaleriaTab from '../GaleriaTab'
import IdiomasTab from './IdiomasTab'
import GestaoTab from './GestaoTab'
import WhatsAppTab from './WhatsAppTab'
import PixTab from './PixTab'
import FuncionariosTab from '../../gerenciar/FuncionariosTab'

interface ConfiguracoesTabProps {
  estabelecimento: {
    id: string
    google_place_id: string | null
    cardapio_variacoes_ativado?: boolean
    cardapio_complementos_ativado?: boolean
    [key: string]: any
  }
  readOnly?: boolean
  recursosPlano?: string[]
}

const SECOES = [
  { id: 'horarios', label: 'Horários', Icone: Clock },
  { id: 'galeria', label: 'Galeria', Icone: Image },
  { id: 'comodidades', label: 'Comodidades', Icone: Sparkles },
  { id: 'avaliacoes', label: 'Avaliações Google', Icone: Star },
  { id: 'idiomas', label: 'Idiomas', Icone: Globe },
  { id: 'cardapio-recursos', label: 'Recursos do cardápio', Icone: SlidersHorizontal },
  { id: 'whatsapp', label: 'WhatsApp', Icone: MessageCircle },
  { id: 'pix', label: 'Pix', Icone: Wallet },
  { id: 'gestao', label: 'Módulo de Gestão', Icone: Wrench },
  { id: 'equipe', label: 'Equipe', Icone: Users },
] as const

export default function ConfiguracoesTab({ estabelecimento, readOnly, recursosPlano }: ConfiguracoesTabProps) {
  const [secaoAtiva, setSecaoAtiva] = useState<string>('horarios')

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Menu lateral das sub-seções */}
      <div className="flex gap-1 overflow-x-auto md:w-52 md:flex-none md:flex-col md:overflow-visible">
        {SECOES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSecaoAtiva(s.id)}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition md:whitespace-normal ${
              secaoAtiva === s.id
                ? 'bg-orange-50 text-orange-700 md:border-l-2 md:border-orange-500'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <s.Icone className={`h-4 w-4 shrink-0 ${secaoAtiva === s.id ? 'text-orange-600' : 'text-neutral-400'}`} />
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
          <IdiomasTab estabelecimento={estabelecimento} recursosPlano={recursosPlano} />
        )}
        {secaoAtiva === 'cardapio-recursos' && (
          <CardapioRecursosTab estabelecimento={estabelecimento} readOnly={readOnly} recursosPlano={recursosPlano} />
        )}
        {secaoAtiva === 'whatsapp' && (
          <WhatsAppTab estabelecimento={estabelecimento} readOnly={readOnly} />
        )}
        {secaoAtiva === 'pix' && (
          <PixTab estabelecimento={estabelecimento} readOnly={readOnly} />
        )}
        {secaoAtiva === 'gestao' && (
          <GestaoTab estabelecimento={estabelecimento} readOnly={readOnly} />
        )}
        {secaoAtiva === 'equipe' && (
          <FuncionariosTab estabelecimentoId={estabelecimento.id} />
        )}
      </div>
    </div>
  )
}
