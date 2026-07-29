'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import TabsContainer from '@/app/(dashboard)/painel/components/TabsContainer'
import CardapioTab from '../../editar/CardapioTab'
import QrCodeTab from '../../editar/QrCodeTab'
import PromocoesTab from '../../editar/PromocoesTab'
import { TemaEditor } from '@/components/tema'
import ConfiguracoesTab from '../../editar/components/ConfiguracoesTab'
import FuncionariosTab from '../FuncionariosTab'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'

export default function CardapioModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    estabelecimento,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
    podeEditarCardapio,
  } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  const tabs = [
    {
      id: 'cardapio',
      label: '🍽️ Cardápio',
      content: <CardapioTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditarCardapio} />,
    },
    ...(ehDonoOuGerente
      ? [
          {
            id: 'promocoes',
            label: '⭐ Promoções',
            content: <PromocoesTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
          },
          {
            id: 'qrcode',
            label: '📱 QR Code',
            content: (
              <QrCodeTab
                estabelecimentoId={estabelecimento.id}
                shortUrl={estabelecimento.qrcode_short_url}
                slug={estabelecimento.slug}
                logoUrl={estabelecimento.logo_url}
              />
            ),
          },
          {
            id: 'configuracoes',
            label: '⚙️ Configurações',
            content: <ConfiguracoesTab estabelecimento={estabelecimento} readOnly={!podeEditar} />,
          },
          {
            id: 'tema',
            label: '🎨 Tema',
            content: (
              <TemaEditor
                estabelecimentoId={estabelecimento.id}
                temaAtualId={estabelecimento.tema_atual_id}
                readOnly={!ehDonoOuGerente}
                onTemaChange={(temaId) => {
                  console.log('Tema alterado para:', temaId)
                }}
              />
            ),
          },
          {
            id: 'equipe',
            label: '👥 Equipe',
            content: <FuncionariosTab estabelecimentoId={estabelecimento.id} />,
          },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
            aria-label="Voltar"
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-white hover:text-orange-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">🍽️ Cardápio</h1>
        </div>

        <TabsContainer tabs={tabs} defaultTab="cardapio" />
      </div>
    </div>
  )
}
