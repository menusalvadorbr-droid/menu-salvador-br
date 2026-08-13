import { createClient } from '@/lib/supabase/server'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PendenciasBairro from './PendenciasBairro'
import type { EstabelecimentoPendente } from './PendenciasBairro'

export default async function PendenciasBairroPage() {
  const supabase = await createClient()

  const [{ data: pendentes }, { data: bairros }] = await Promise.all([
    supabase
      .from('estabelecimentos')
      .select('id, nome_fantasia, nome, bairro_informado, cidade_id, cidades(nome)')
      .is('bairro_id', null)
      .not('cidade_id', 'is', null)
      .eq('status', 'active')
      .eq('ativo', true)
      .order('created_at', { ascending: true }),
    supabase.from('bairros').select('id, nome, cidade_id').order('nome'),
  ])

  interface LinhaPendente {
    id: string
    nome_fantasia: string | null
    nome: string
    bairro_informado: string | null
    cidade_id: string
    cidades: { nome: string } | { nome: string }[] | null
  }

  const pendentesFormatados: EstabelecimentoPendente[] = ((pendentes || []) as LinhaPendente[]).map((p) => ({
    id: p.id,
    nome_fantasia: p.nome_fantasia,
    nome: p.nome,
    bairro_informado: p.bairro_informado,
    cidade_id: p.cidade_id,
    cidadeNome: (Array.isArray(p.cidades) ? p.cidades[0]?.nome : p.cidades?.nome) || '—',
  }))

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        titulo="Bairros pendentes"
        descricao="Estabelecimentos cadastrados por CNPJ cuja cidade está coberta, mas cujo bairro não bateu com nenhum já cadastrado — entraram no diretório mesmo assim, esperando curadoria aqui."
      />
      <PendenciasBairro pendentesIniciais={pendentesFormatados} bairros={bairros || []} />
    </div>
  )
}
