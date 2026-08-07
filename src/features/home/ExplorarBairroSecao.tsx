import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'

interface BairroComContagem {
  id: string
  nome: string
  slug: string
  estabelecimentos: { count: number }[]
}

/**
 * Grid de bairros com contagem real de estabelecimentos — agregado do
 * lado do banco via embed de contagem do PostgREST
 * (`estabelecimentos!inner(count)` filtrado por status/ativo), não N
 * consultas separadas. Bairro sem nenhum estabelecimento ativo não
 * aparece (card levando a zero resultado não ajuda ninguém). Cada card
 * leva pra /[bairro-slug], a mesma BairroPage que já existe.
 */
export default async function ExplorarBairroSecao() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bairros')
    .select('id, nome, slug, estabelecimentos!inner(count)')
    .eq('estabelecimentos.status', 'active')
    .eq('estabelecimentos.ativo', true)
    .order('nome')

  const bairros = ((data || []) as BairroComContagem[])
    .map((b) => ({ id: b.id, nome: b.nome, slug: b.slug, total: b.estabelecimentos[0]?.count ?? 0 }))
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total)

  if (bairros.length === 0) return null

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeading title="Explorar por bairro" subtitle="Onde você quer comer hoje?" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {bairros.map((bairro) => (
          <Link
            key={bairro.id}
            href={`/${bairro.slug}`}
            className="group rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-md"
          >
            <div className="text-2xl">📍</div>
            <h3 className="mt-1.5 text-sm font-semibold text-neutral-800 group-hover:text-[var(--brand-primary)]">
              {bairro.nome}
            </h3>
            <p className="mt-0.5 text-xs text-neutral-400">
              {bairro.total} {bairro.total === 1 ? 'lugar' : 'lugares'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
