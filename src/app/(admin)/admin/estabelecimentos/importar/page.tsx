import { createClient } from '@/lib/supabase/server'
import ImportarEstabelecimentos from './ImportarEstabelecimentos'

export default async function ImportarEstabelecimentosPage() {
  const supabase = await createClient()

  const [{ data: bairros }, { data: tiposEstabelecimento }, { data: tiposCozinha }] = await Promise.all([
    supabase.from('bairros').select('id, nome').order('nome'),
    supabase.from('tipos_estabelecimento').select('slug, nome, icone').eq('ativo', true).order('ordem'),
    supabase.from('tipos_cozinha').select('id, nome, icone').eq('ativo', true).order('ordem'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Importar estabelecimentos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cole uma lista de CNPJs, revise um por um e insira no diretório.
        </p>
      </div>

      <ImportarEstabelecimentos
        bairros={bairros || []}
        tiposEstabelecimento={tiposEstabelecimento || []}
        tiposCozinha={tiposCozinha || []}
      />
    </div>
  )
}
