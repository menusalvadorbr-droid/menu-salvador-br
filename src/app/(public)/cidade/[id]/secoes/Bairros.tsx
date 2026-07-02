import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SectionHeading from '@/components/public/SectionHeading'

export default async function SecaoBairros({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: bairros } = await supabase
    .from('bairros')
    .select('*')
    .eq('cidade_id', cidadeId)
    .order('nome')

  if (!bairros?.length) return null

  return (
    <section className="space-y-4">
      <SectionHeading title="Bairros" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {bairros.map((b) => (
          <Link
            key={b.id}
            href={`/cidade/bairro/${b.id}`}
            className="block overflow-hidden rounded-xl border border-neutral-100 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-orange-200"
          >
            <h3 className="text-lg font-semibold text-neutral-800">{b.nome}</h3>
            {b.imagem_capa && (
              <img src={b.imagem_capa} alt={b.nome} className="mt-3 h-32 w-full rounded-lg object-cover" />
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
