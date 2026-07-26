import { createClient } from '@/lib/supabase/server'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoCulinarias() {
  const supabase = await createClient()
  const { data: tiposCozinha } = await supabase
    .from('tipos_cozinha')
    .select('*')
    .eq('ativo', true)
    .order('ordem')

  if (!tiposCozinha?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Culinárias 🍽️" />
      <div className="flex gap-3 overflow-x-auto py-2">
        {tiposCozinha.map((t) => (
          <a
            key={t.id}
            href={`/culinaria/${t.slug}`}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-neutral-100 bg-white px-4 py-2 shadow-sm transition hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/40"
          >
            {t.icone && <span className="text-xl">{t.icone}</span>}
            <span className="text-sm font-medium">{t.nome}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
