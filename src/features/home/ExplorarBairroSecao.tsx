import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'

interface BairroComContagem {
  id: string
  nome: string
  slug: string
  cidade_id: string
  cidades: { nome: string } | { nome: string }[] | null
  estabelecimentos: { count: number }[]
}

/**
 * Grid de bairros com contagem real de estabelecimentos — agregado do
 * lado do banco via embed de contagem do PostgREST
 * (`estabelecimentos!inner(count)` filtrado por status/ativo), não N
 * consultas separadas. Bairro sem nenhum estabelecimento ativo não
 * aparece (card levando a zero resultado não ajuda ninguém). Cada card
 * leva pra /[bairro-slug], a mesma BairroPage que já existe.
 *
 * Agrupado por cidade — antes misturava bairro de todas as cidades juntos
 * sem nenhuma indicação de qual cidade era qual, o que só não confundia
 * enquanto só Salvador tinha bairro cadastrado.
 */
export default async function ExplorarBairroSecao() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bairros')
    .select('id, nome, slug, cidade_id, cidades(nome), estabelecimentos!inner(count)')
    .eq('estabelecimentos.status', 'active')
    .eq('estabelecimentos.ativo', true)
    .order('nome')

  const bairros = ((data || []) as BairroComContagem[]).map((b) => ({
    id: b.id,
    nome: b.nome,
    slug: b.slug,
    cidadeId: b.cidade_id,
    nomeCidade: (Array.isArray(b.cidades) ? b.cidades[0]?.nome : b.cidades?.nome) || '',
    total: b.estabelecimentos[0]?.count ?? 0,
  })).filter((b) => b.total > 0)

  if (bairros.length === 0) return null

  const gruposPorCidade = Array.from(
    bairros.reduce((mapa, b) => {
      if (!mapa.has(b.cidadeId)) mapa.set(b.cidadeId, { nomeCidade: b.nomeCidade, bairros: [] as typeof bairros })
      mapa.get(b.cidadeId)!.bairros.push(b)
      return mapa
    }, new Map<string, { nomeCidade: string; bairros: typeof bairros }>())
  )
    .map(([cidadeId, grupo]) => ({
      cidadeId,
      nomeCidade: grupo.nomeCidade,
      totalCidade: grupo.bairros.reduce((soma, b) => soma + b.total, 0),
      bairros: grupo.bairros.sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.totalCidade - a.totalCidade)

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeading title="Explorar por bairro" subtitle="Onde você quer comer hoje?" />
      <div className="mt-6 flex flex-col gap-8">
        {gruposPorCidade.map((grupo) => (
          <div key={grupo.cidadeId}>
            {gruposPorCidade.length > 1 && (
              <h3 className="mb-3 text-sm font-semibold text-neutral-600">{grupo.nomeCidade}</h3>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {grupo.bairros.map((bairro) => (
                <Link
                  key={bairro.id}
                  href={`/${bairro.slug}`}
                  className="group rounded-2xl border border-neutral-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[var(--brand-primary)]/40 hover:shadow-md"
                >
                  <div className="text-2xl">📍</div>
                  <h4 className="mt-1.5 text-sm font-semibold text-neutral-800 group-hover:text-[var(--brand-primary)]">
                    {bairro.nome}
                  </h4>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {bairro.total} {bairro.total === 1 ? 'lugar' : 'lugares'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
