import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

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
  /** @deprecated coluna solta antiga — use estabelecimento_tipos_cozinha, mantido só como fallback */
  tipo_cozinha?: string | null
  /** Vem do embed `estabelecimento_tipos_cozinha(tipos_cozinha(nome))` — até 3 culinárias por estabelecimento. */
  estabelecimento_tipos_cozinha?: { tipos_cozinha: { nome: string } | null }[] | null
  descricao?: string | null
  destaque?: boolean | null
  galeria_fotos?: string[] | null
  capa_url?: string | null
  foto_capa?: string | null
  scans_qrcode?: number | null
}

/**
 * Card padrão usado nas listagens públicas (home, cidade, bairro, tipo,
 * culinária, destaques, populares...). Mantém uma única fonte visual
 * para os cards de estabelecimento em vez de markup duplicado em cada
 * página.
 */
export default function EstablishmentCard({
  estabelecimento,
  href,
}: {
  estabelecimento: EstablishmentCardData
  href: string
}) {
  const nome = estabelecimento.nome_fantasia || estabelecimento.nome
  const imagemBruta =
    estabelecimento.galeria_fotos?.[0] ||
    estabelecimento.capa_url ||
    estabelecimento.foto_capa ||
    null
  const imagem = getOptimizedCloudinaryUrl(imagemBruta, 400, 300, 'fill')
  const icone = estabelecimento.tipo_estabelecimento
    ? ICONES_TIPO[estabelecimento.tipo_estabelecimento] || '🏪'
    : '🏪'
  const popular = (estabelecimento.scans_qrcode ?? 0) > 50

  // Culinárias reais (até 3, via tabela de junção). Se o embed não veio
  // (chamador antigo que ainda não busca essa relação), cai pro campo
  // solto legado só pra não deixar o card em branco.
  const cozinhas = estabelecimento.estabelecimento_tipos_cozinha?.length
    ? estabelecimento.estabelecimento_tipos_cozinha
        .map((v) => v.tipos_cozinha?.nome)
        .filter((n): n is string => Boolean(n))
    : estabelecimento.tipo_cozinha
      ? [estabelecimento.tipo_cozinha]
      : []

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--brand-primary)]/40"
    >
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{ background: 'linear-gradient(to bottom right, var(--brand-primary), var(--brand-secondary))' }}
      >
        {imagem ? (
          <Image
            src={imagem}
            alt={nome}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {icone}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {estabelecimento.destaque && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
              ⭐ Destaque
            </span>
          )}
        </div>
        {popular && (
          <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            🔥 Popular
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-neutral-900 group-hover:text-[var(--brand-primary)]">
          {nome}
        </h3>
        {estabelecimento.bairro && (
          <p className="flex items-center gap-1 text-xs text-neutral-500">
            📍 {estabelecimento.bairro}
          </p>
        )}
        {cozinhas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cozinhas.map((c) => (
              <span
                key={c}
                className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {estabelecimento.descricao && (
          <p className="line-clamp-2 text-xs text-neutral-400">{estabelecimento.descricao}</p>
        )}
        <span
          className="mt-auto pt-2 text-xs font-semibold uppercase tracking-wide group-hover:underline"
          style={{ color: 'var(--brand-primary)' }}
        >
          Ver cardápio →
        </span>
      </div>
    </Link>
  )
}
