import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import type { EstabelecimentoComJoins } from './tipos'

/**
 * Vitrine curada — reaproveita o campo `destaque` que já existe
 * (marcado manualmente pelo admin geral em /admin/estabelecimentos), com
 * um rótulo explícito deixando claro que é curadoria, não um ranking
 * automático qualquer.
 */
export default async function RecomendadosSecao() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('estabelecimentos')
    .select('*, bairros(nome, slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')
    .eq('status', 'active')
    .eq('ativo', true)
    .eq('destaque', true)
    .not('bairro_id', 'is', null)
    .not('tipo_estabelecimento', 'is', null)
    .order('nome')
    .limit(6)

  const recomendados = (data || []) as unknown as EstabelecimentoComJoins[]
  if (recomendados.length === 0) return null

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeading title="⭐ Recomendados" subtitle="Selecionados pela nossa equipe — curadoria, não algoritmo" />
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {recomendados.map((est) => {
          const bairroSlug = est.bairros?.slug
          const href = est.cidade && bairroSlug && est.tipo_estabelecimento
            ? `/${est.cidade}/${bairroSlug}/${est.tipo_estabelecimento}/${est.slug}`
            : `/cardapio/${est.slug}`
          return <EstablishmentCard key={est.id} estabelecimento={est} href={href} />
        })}
      </div>
    </div>
  )
}
