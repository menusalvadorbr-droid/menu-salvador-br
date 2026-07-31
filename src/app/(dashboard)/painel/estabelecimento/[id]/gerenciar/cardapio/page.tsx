'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import TabsContainer from '@/app/(dashboard)/painel/components/TabsContainer'
import CardapioTab from '../../editar/CardapioTab'
import QrCodeTab from '../../editar/QrCodeTab'
import QrPorMesaTab from '../../editar/QrPorMesaTab'
import PromocoesTab from '../../editar/PromocoesTab'
import { planoTemRecurso } from '@/lib/recursosPlano'
import { TemaEditor } from '@/components/tema'
import ConfiguracoesTab from '../../editar/components/ConfiguracoesTab'
import FuncionariosTab from '../FuncionariosTab'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../CabecalhoGerenciar'

export default function CardapioModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contaAberta, setContaAberta] = useState(false)
  const {
    estabelecimento,
    usuarioNome,
    usuarioLogadoId,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
    podeEditarCardapio,
    recursosPlano,
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
          ...(planoTemRecurso(recursosPlano, 'qr_mesa')
            ? [
                {
                  id: 'qr-mesa',
                  label: '🪑 QR por mesa',
                  content: (
                    <QrPorMesaTab estabelecimentoId={estabelecimento.id} slug={estabelecimento.slug} readOnly={!podeEditar} />
                  ),
                },
              ]
            : []),
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
        <CabecalhoGerenciar
          estabelecimento={estabelecimento}
          usuarioNome={usuarioNome}
          usuarioLogadoId={usuarioLogadoId}
          ehDonoOuGerente={ehDonoOuGerente}
          podeEditar={podeEditar}
          aoVoltar={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
          tituloPagina={{ icone: '🍽️', texto: 'Cardápio' }}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        <TabsContainer tabs={tabs} defaultTab="cardapio" />
      </div>
    </div>
  )
}
