import Link from 'next/link'

const ICONES_TIPO: Record<string, string> = {
  banca_acaraje: '🫘',
  bar: '🍺',
  restaurante: '🍽️',
  cafeteria: '☕',
  foodtruck: '🚚',
  lanchonete: '🥪',
}

export interface EstablishmentCardData {
  id: string
  nome: string
  nome_fantasia?: string | null
  slug?: string | null
  bairro?: string | null
  tipo_estabelecimento?: string | null
  tipo_cozinha?: string | null
  descricao?: string | null
  destaque?: boolean | null
  galeria_fotos?: string[] | null
  capa_url?: string | null
  foto_capa?: string | null
}

/**
 * Card padrão usado nas listagens públicas (home, cidade, bairro, tipo,
 * destaques, populares...). Mantém uma única fonte visual para os cards
 * de estabelecimento em vez de markup duplicado em cada página.
 */
export default function EstablishmentCard({
  estabelecimento,
  href,
}: {
  estabelecimento: EstablishmentCardData
  href: string
}) {
  const nome = estabelecimento.nome_fantasia || estabelecimento.nome
  const imagem =
    estabelecimento.galeria_fotos?.[0] ||
    estabelecimento.capa_url ||
    estabelecimento.foto_capa ||
    null
  const icone = estabelecimento.tipo_estabelecimento
    ? ICONES_TIPO[estabelecimento.tipo_estabelecimento] || '🏪'
    : '🏪'

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-200"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-orange-400 to-red-500">
        {imagem ? (
          <img
            src={imagem}
            alt={nome}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {icone}
          </div>
        )}
        {estabelecimento.destaque && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
            ⭐ Destaque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-neutral-900 group-hover:text-orange-600">
          {nome}
        </h3>
        <p className="flex items-center gap-1 text-xs text-neutral-500">
          {estabelecimento.bairro && <span>📍 {estabelecimento.bairro}</span>}
          {estabelecimento.bairro && estabelecimento.tipo_cozinha && <span>•</span>}
          {estabelecimento.tipo_cozinha && <span>{estabelecimento.tipo_cozinha}</span>}
        </p>
        {estabelecimento.descricao && (
          <p className="line-clamp-2 text-xs text-neutral-400">{estabelecimento.descricao}</p>
        )}
        <span className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide text-orange-600 group-hover:underline">
          Ver cardápio →
        </span>
      </div>
    </Link>
  )
}
