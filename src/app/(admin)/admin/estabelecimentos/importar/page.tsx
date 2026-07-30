import { createClient } from '@/lib/supabase/server'
import ImportarEstabelecimentos from './ImportarEstabelecimentos'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default async function ImportarEstabelecimentosPage() {
  const supabase = await createClient()

  const [{ data: bairros }, { data: tiposEstabelecimento }, { data: tiposCozinha }] = await Promise.all([
    supabase.from('bairros').select('id, nome').order('nome'),
    supabase.from('tipos_estabelecimento').select('slug, nome, icone').eq('ativo', true).order('ordem'),
    supabase.from('tipos_cozinha').select('id, nome, icone').eq('ativo', true).order('ordem'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        titulo="Importar estabelecimentos"
        descricao="Cole uma lista de CNPJs, revise um por um e insira no diretório."
      />

      <ImportarEstabelecimentos
        bairros={bairros || []}
        tiposEstabelecimento={tiposEstabelecimento || []}
        tiposCozinha={tiposCozinha || []}
      />
    </div>
  )
}
