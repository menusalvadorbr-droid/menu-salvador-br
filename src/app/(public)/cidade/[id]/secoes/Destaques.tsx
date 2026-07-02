import { createClient } from '@/lib/supabase/server'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoDestaques({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: destaques } = await supabase
    .from('destaques')
    .select('*, estabelecimentos(*)')
    .eq('cidade_id', cidadeId)
    .eq('ativa', true)
    .order('ordem', { ascending: true })

  if (!destaques?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Destaques da cidade ⭐" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {destaques.map((d: any) => (
          <EstablishmentCard
            key={d.id}
            estabelecimento={d.estabelecimentos}
            href={`/cardapio/${d.estabelecimentos.slug}`}
          />
        ))}
      </div>
    </section>
  )
}
