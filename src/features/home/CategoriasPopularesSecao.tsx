import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'

interface TipoCozinhaComContagem {
  id: number
  nome: string
  slug: string
  icone: string | null
  estabelecimento_tipos_cozinha: { count: number }[]
}

/**
 * Vitrine de tipos de culinária com ícone grande — "populares" = mais
 * estabelecimentos vinculados (contagem real via embed do PostgREST na
 * tabela de junção, mesmo padrão de ExplorarBairroSecao). Cada card leva
 * pra /culinaria/[slug], página que já existe.
 */
export default async function CategoriasPopularesSecao() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tipos_cozinha')
    .select('id, nome, slug, icone, estabelecimento_tipos_cozinha(count)')
    .eq('ativo', true)

  const tipos = ((data || []) as TipoCozinhaComContagem[])
    .map((t) => ({ id: t.id, nome: t.nome, slug: t.slug, icone: t.icone, total: t.estabelecimento_tipos_cozinha[0]?.count ?? 0 }))
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  if (tipos.length === 0) return null

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeading title="Categorias populares" subtitle="Os tipos de culinária mais procurados" />
      <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {tipos.map((tipo) => (
          <Link
            key={tipo.id}
            href={`/culinaria/${tipo.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-md"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 text-4xl transition group-hover:bg-[color-mix(in_srgb,var(--brand-primary)_10%,white)]">
              {tipo.icone || '🍽️'}
            </div>
            <h3 className="text-xs font-semibold capitalize text-neutral-800 group-hover:text-[var(--brand-primary)]">
              {tipo.nome}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  )
}
