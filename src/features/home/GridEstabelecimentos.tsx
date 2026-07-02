'use client'

import Link from 'next/link'

function getCloudinaryUrl(url: string | null, width: number, height: number): string {
  if (!url) return ''
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`)
}

const ICONES_TIPO: Record<string, string> = {
  banca_acaraje: '🫘',
  bar: '🍺',
  restaurante: '🍽️',
  cafeteria: '☕',
  foodtruck: '🚚',
  lanchonete: '🥪',
}

interface GridEstabelecimentosProps {
  estabelecimentos: any[]
}

export default function GridEstabelecimentos({ estabelecimentos }: GridEstabelecimentosProps) {
  if (estabelecimentos.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl">🍽️</span>
        <p className="text-xl text-gray-500 mt-4">Nenhum estabelecimento encontrado com esses filtros.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {estabelecimentos.map((est) => {
        const urlThumb = getCloudinaryUrl(est.foto_capa, 400, 300)
        const nomeExibicao = est.nome_fantasia || est.nome
        const href = est.cidade && est.bairro && est.tipo_estabelecimento
          ? `/${est.cidade}/${est.bairro}/${est.tipo_estabelecimento}/${est.slug}`
          : `/cardapio/${est.slug}`
        return (
          <Link
            key={est.id}
            href={href}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200"
          >
            <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500">
              {urlThumb ? (
                <img
                  src={urlThumb}
                  alt={nomeExibicao}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-6xl">
                  {ICONES_TIPO[est.tipo_estabelecimento] || '🏪'}
                </div>
              )}
              {est.destaque && (
                <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold shadow">
                  ⭐ Destaque
                </span>
              )}
              {(est.scans_qrcode > 50) && (
                <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
                  🔥 Popular
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-orange-600 transition">
                {nomeExibicao}
              </h3>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <span>📍 {est.bairro}</span>
                <span>•</span>
                <span>{est.tipo_cozinha}</span>
              </div>
              <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                {est.descricao || 'Cardápio digital disponível'}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-600 font-medium group-hover:underline">
                  📱 Ver cardápio →
                </span>
                {est.whatsapp && <span className="text-green-600">💬</span>}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}