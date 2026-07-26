import { createClient } from '@/lib/supabase/server'
import BairrosManager from './BairrosManager'
import type { BairroComContagem } from './BairrosManager'

export default async function AdminBairrosPage() {
  const supabase = await createClient()

  const { data: bairros } = await supabase.from('bairros').select('id, nome, slug, icone').order('nome')

  const { data: contagens } = await supabase
    .from('estabelecimentos')
    .select('bairro_id')
    .not('bairro_id', 'is', null)

  const contagemPorBairro = new Map<string, number>()
  for (const linha of contagens || []) {
    contagemPorBairro.set(linha.bairro_id, (contagemPorBairro.get(linha.bairro_id) || 0) + 1)
  }

  const bairrosComContagem: BairroComContagem[] = (bairros || []).map((b) => ({
    ...b,
    totalEstabelecimentos: contagemPorBairro.get(b.id) || 0,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Bairros</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Lista de bairros disponível pra todos os donos de estabelecimento escolherem no cadastro.
      </p>
      <div className="mt-6">
        <BairrosManager bairrosIniciais={bairrosComContagem} />
      </div>
    </div>
  )
}
