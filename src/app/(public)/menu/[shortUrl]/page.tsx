import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface MenuDigitalPageProps {
  params: Promise<{ shortUrl: string }>
}

export default async function MenuDigitalPage({ params }: MenuDigitalPageProps) {
  const { shortUrl } = await params

  // Busca o estabelecimento pela shortUrl
  const { data: estabelecimento, error } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('qrcode_short_url', shortUrl)
    .eq('status', 'active')
    .eq('ativo', true)
    .single()

  if (error || !estabelecimento) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            {estabelecimento.logo_url && (
              <Image
                src={estabelecimento.logo_url}
                alt={estabelecimento.nome}
                width={64}
                height={64}
                className="rounded-full border"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{estabelecimento.nome_fantasia || estabelecimento.nome}</h1>
              <p className="text-gray-500">{estabelecimento.tipo_cozinha}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 Cardápio Digital</h2>
          <p className="text-gray-500">Cardápio em construção. Em breve você poderá ver todos os itens aqui.</p>
          <Link href={`/${estabelecimento.cidade}/${estabelecimento.bairro}/${estabelecimento.tipo_estabelecimento}/${estabelecimento.slug}`} className="mt-4 inline-block text-orange-600 hover:underline">
            Ver perfil do estabelecimento →
          </Link>
        </div>
      </div>
    </div>
  )
}