import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TabsContainer from '@/components/TabsContainer'
import EditarEstabelecimentoForm from './EditarEstabelecimentoForm'
import HorariosEditor from '@/components/HorariosEditor'
import CardapioTab from './CardapioTab'
import GaleriaTab from './GaleriaTab'
import PromocoesTab from './PromocoesTab'
import QrCodeTab from './QrCodeTab'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarEstabelecimentoPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/painel')

  const { data: estabelecimento, error } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !estabelecimento) notFound()
  if (estabelecimento.owner_user_id !== user.id) redirect('/painel')

  const podeEditar = estabelecimento.status === 'active'

  const statusInfo = {
    active: { label: '✅ Ativo', bg: 'bg-green-100 text-green-800 border-green-200' },
    pending_review: { label: '⏳ Pendente', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    blocked: { label: '🚫 Bloqueado', bg: 'bg-red-100 text-red-800 border-red-200' },
  }[estabelecimento.status] || { label: estabelecimento.status, bg: 'bg-gray-100 text-gray-800 border-gray-200' }

  const tabs = [
    {
      id: 'info',
      label: '📋 Informações',
      content: (
        <EditarEstabelecimentoForm
          estabelecimento={estabelecimento}
          podeEditar={podeEditar}
          userId={user.id}
        />
      ),
    },
    {
      id: 'horarios',
      label: '🕒 Horários',
      content: <HorariosEditor estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
    },
    {
      id: 'cardapio',
      label: '🍽️ Cardápio',
      content: <CardapioTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
    },
    {
      id: 'galeria',
      label: '🖼️ Galeria',
      content: <GaleriaTab estabelecimentoId={estabelecimento.id} readOnly={!podeEditar} />,
    },
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
          slug={estabelecimento.slug}  // ← passando o slug para o QR Code
          logoUrl={estabelecimento.logo_url}
          modeloQr={{
            cor_frente: estabelecimento.qrcode_modelo === 'classico' ? '#000000' : '#f97316',
            cor_fundo: '#ffffff',
            slug: estabelecimento.qrcode_modelo || 'classico',
          }}
          readOnly={!podeEditar}
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/painel" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
              ← Voltar ao painel
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{estabelecimento.nome}</h1>
              <p className="text-sm text-gray-500">Gerencie todas as informações</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        </div>

        {!podeEditar && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg text-sm text-yellow-700 flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="font-medium">Edição bloqueada</p>
              <p>Este estabelecimento está {estabelecimento.status === 'pending_review' ? 'aguardando aprovação' : 'bloqueado pela plataforma'}.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <TabsContainer tabs={tabs} defaultTab="info" />
        </div>
      </div>
    </div>
  )
}