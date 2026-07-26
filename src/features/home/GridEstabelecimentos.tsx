'use client'

import EstablishmentCard from '@/components/public/EstablishmentCard'

interface GridEstabelecimentosProps {
  estabelecimentos: any[]
}

/**
 * Antes esse componente tinha seu próprio card com markup duplicado do
 * EstablishmentCard (mesmo mapa de ícones copiado em dois arquivos, e o
 * mesmo bug de exibir `tipo_cozinha` como texto solto). Unificado pra
 * usar o card compartilhado — corrige os dois de uma vez e evita que
 * eles voltem a divergir no futuro.
 */
export default function GridEstabelecimentos({ estabelecimentos }: GridEstabelecimentosProps) {
  if (estabelecimentos.length === 0) {
    return (
      <div className="py-16 text-center">
        <span className="text-6xl">🍽️</span>
        <p className="mt-4 text-xl text-gray-500">
          Nenhum estabelecimento encontrado com esses filtros.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {estabelecimentos.map((est) => {
        const bairroSlug = est.bairros?.slug
        const href = est.cidade && bairroSlug && est.tipo_estabelecimento
          ? `/${est.cidade}/${bairroSlug}/${est.tipo_estabelecimento}/${est.slug}`
          : `/cardapio/${est.slug}`
        return <EstablishmentCard key={est.id} estabelecimento={est} href={href} />
      })}
    </div>
  )
}
