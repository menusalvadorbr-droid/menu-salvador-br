import { createClient } from '@/lib/supabase/server'
import ItemPublico from '@/app/estabelecimento/[id]/ItemPublico'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoPromocoes({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: itens } = await supabase
    .from('itens_cardapio')
    .select('*')
    .eq('cidade_id', cidadeId)
    .eq('promocao_ativa', true)
    .order('ordem', { ascending: true })
    .limit(12)

  if (!itens?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Promoções na cidade 🎉" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {itens.map((item) => (
          <ItemPublico key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
