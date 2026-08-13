import { createClient } from '@/lib/supabase/server'
import CidadesManager from './CidadesManager'
import type { CidadeComContagem } from './CidadesManager'

export default async function AdminCidadesPage() {
  const supabase = await createClient()

  const [{ data: cidades }, { data: bairros }, { data: estabelecimentos }] = await Promise.all([
    supabase.from('cidades').select('id, nome, slug').order('nome'),
    supabase.from('bairros').select('cidade_id').not('cidade_id', 'is', null),
    supabase.from('estabelecimentos').select('cidade_id').not('cidade_id', 'is', null),
  ])

  const bairrosPorCidade = new Map<string, number>()
  for (const b of bairros || []) {
    if (b.cidade_id) bairrosPorCidade.set(b.cidade_id, (bairrosPorCidade.get(b.cidade_id) || 0) + 1)
  }
  const estabelecimentosPorCidade = new Map<string, number>()
  for (const e of estabelecimentos || []) {
    if (e.cidade_id) estabelecimentosPorCidade.set(e.cidade_id, (estabelecimentosPorCidade.get(e.cidade_id) || 0) + 1)
  }

  const cidadesComContagem: CidadeComContagem[] = (cidades || []).map((c) => ({
    ...c,
    totalBairros: bairrosPorCidade.get(c.id) || 0,
    totalEstabelecimentos: estabelecimentosPorCidade.get(c.id) || 0,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Cidades</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Lista de cobertura do menu.salvador — só cidades cadastradas aqui podem receber estabelecimento novo pelo
        cadastro por CNPJ. Fora dessa lista, o cadastro é bloqueado com aviso de fora de cobertura.
      </p>
      <div className="mt-6">
        <CidadesManager cidadesIniciais={cidadesComContagem} />
      </div>
    </div>
  )
}
