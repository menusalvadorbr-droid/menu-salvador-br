import { createClient } from '@/lib/supabase/server'

export default async function SecaoPropaganda({ cidadeId }: { cidadeId: string }) {
  const supabase = await createClient()
  const { data: propaganda } = await supabase
    .from('propagandas')
    .select('*')
    .eq('cidade_id', cidadeId)
    .eq('ativa', true)
    .order('ordem', { ascending: true })
    .limit(1)
    .single()

  if (!propaganda) return null

  return (
    <section>
      <div className="flex gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-sm transition hover:shadow-md">
        {propaganda.imagem && (
          <img
            src={propaganda.imagem}
            alt={propaganda.titulo}
            className="h-24 w-24 rounded-lg border object-cover"
          />
        )}
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold text-neutral-800">{propaganda.titulo}</h3>
          <p className="text-sm text-neutral-600">{propaganda.descricao}</p>
          {propaganda.link && (
            <a
              href={propaganda.link}
              className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white shadow-sm transition hover:bg-blue-700"
            >
              Ver mais
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
