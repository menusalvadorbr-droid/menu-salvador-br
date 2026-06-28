'use client'

import Link from 'next/link'
import Image from 'next/image'

interface EstabelecimentoCardProps {
  estabelecimento: any
  cidade?: string
  tipo?: string
}

export default function EstabelecimentoCard({ estabelecimento, cidade, tipo }: EstabelecimentoCardProps) {
  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const href = cidade && tipo 
    ? `/${cidade}/${tipo}/${estabelecimento.slug}`
    : `/${estabelecimento.slug}`

  return (
    <Link href={href} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200 hover:-translate-y-1">
      {/* Imagem */}
      <div className="relative h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {estabelecimento.foto_capa ? (
          <Image
            src={estabelecimento.foto_capa}
            alt={nomeExibicao}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🏪
          </div>
        )}
        {estabelecimento.destaque && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ⭐ Destaque
          </div>
        )}
        {/* Overlay com nome e bairro na parte inferior da imagem */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div className="flex items-center gap-2">
            {estabelecimento.logo_url ? (
              <div className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden bg-white flex-shrink-0">
                <Image
                  src={estabelecimento.logo_url}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-xl flex-shrink-0">
                {estabelecimento.tipo_estabelecimento === 'banca_acaraje' ? '🫘' :
                 estabelecimento.tipo_estabelecimento === 'bar' ? '🍺' :
                 estabelecimento.tipo_estabelecimento === 'restaurante' ? '🍽️' : '🏪'}
              </div>
            )}
            <div className="text-white">
              <h3 className="font-bold text-sm line-clamp-1 drop-shadow">{nomeExibicao}</h3>
              <p className="text-xs text-white/80 drop-shadow">{estabelecimento.bairro}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo do card (descrição e tags) */}
      <div className="p-4">
        {estabelecimento.descricao && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {estabelecimento.descricao}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {estabelecimento.tipo_cozinha && (
            <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
              {estabelecimento.tipo_cozinha}
            </span>
          )}
          {estabelecimento.tipo_estabelecimento && (
            <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full border border-gray-100">
              {estabelecimento.tipo_estabelecimento === 'banca_acaraje' ? 'Acarajé' :
               estabelecimento.tipo_estabelecimento === 'foodtruck' ? 'Food Truck' :
               estabelecimento.tipo_estabelecimento === 'lanchonete' ? 'Lanchonete' :
               estabelecimento.tipo_estabelecimento}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}