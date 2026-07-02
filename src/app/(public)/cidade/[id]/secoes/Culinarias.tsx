import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoCulinarias({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: culinarias } = await supabase.from('culinarias').select('*').order('nome')

  if (!culinarias?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Culinárias 🍽️" />
      <div className="flex gap-3 overflow-x-auto py-2">
        {culinarias.map((c) => (
          <a
            key={c.id}
            href={`/culinaria/${c.slug}`}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-neutral-100 bg-white px-4 py-2 shadow-sm transition hover:bg-orange-50 hover:border-orange-200"
          >
            {c.emoji && <span className="text-xl">{c.emoji}</span>}
            {c.icon_svg && <img src={c.icon_svg} alt={c.nome} className="h-6 w-6 object-contain" />}
            <span className="text-sm font-medium">{c.nome}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
