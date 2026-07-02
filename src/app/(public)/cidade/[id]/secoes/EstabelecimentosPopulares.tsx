import { createClient } from '@/lib/supabase/server'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoEstabelecimentosPopulares({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade_id', cidadeId)
    .order('popularidade', { ascending: false })
    .limit(10)

  if (!estabelecimentos?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Populares na cidade 🔥" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {estabelecimentos.map((est: any) => (
          <EstablishmentCard key={est.id} estabelecimento={est} href={`/cardapio/${est.slug}`} />
        ))}
      </div>
    </section>
  )
}
