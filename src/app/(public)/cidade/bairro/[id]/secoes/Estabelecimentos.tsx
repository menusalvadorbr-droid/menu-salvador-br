import { createClient } from '@/lib/supabase/server'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoEstabelecimentos({ bairroId }: { bairroId: string }) {
  const supabase = await createClient()
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('bairro_id', bairroId)
    .order('nome', { ascending: true })

  if (!estabelecimentos?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Estabelecimentos do bairro 🏪" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {estabelecimentos.map((est) => (
          <EstablishmentCard key={est.id} estabelecimento={est} href={`/cardapio/${est.slug}`} />
        ))}
      </div>
    </section>
  )
}
