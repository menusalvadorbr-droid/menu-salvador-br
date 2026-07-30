import { createClient } from '@/lib/supabase/server'
import ContestacoesList from './ContestacoesList'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default async function ContestacoesPage() {
  const supabase = await createClient()

  const { data: contestacoes } = await supabase
    .from('vinculo_contestacoes')
    .select(`
      id, justificativa, created_at,
      estabelecimentos:estabelecimento_id ( id, nome, nome_fantasia, owner_user_id ),
      contestador:usuario_id ( id, nome, cpf, telefone, whatsapp )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // Busca o nome do dono atual de cada estabelecimento contestado (uma
  // consulta separada porque owner_user_id aponta pra profiles, não dá
  // pra embutir dois joins pro mesmo alvo profiles no select acima).
  const donoIds = (contestacoes || [])
    .map((c: any) => c.estabelecimentos?.owner_user_id)
    .filter(Boolean)
  const { data: donos } = donoIds.length
    ? await supabase.from('profiles').select('id, nome').in('id', donoIds)
    : { data: [] }
  const nomeDono = new Map((donos || []).map((d) => [d.id, d.nome]))

  const itens = (contestacoes || []).map((c: any) => ({
    id: c.id,
    justificativa: c.justificativa,
    criadoEm: c.created_at,
    estabelecimentoId: c.estabelecimentos?.id,
    estabelecimentoNome: c.estabelecimentos?.nome_fantasia || c.estabelecimentos?.nome || '—',
    donoAtualNome: nomeDono.get(c.estabelecimentos?.owner_user_id) || '—',
    contestadorNome: c.contestador?.nome || '—',
    contestadorCpf: c.contestador?.cpf || '—',
    contestadorContato: c.contestador?.telefone || c.contestador?.whatsapp || '—',
  }))

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        titulo="Contestações de vínculo"
        descricao="Alguém acha que um estabelecimento com dono deveria estar vinculado a ela. Decida transferir ou descartar."
      />

      <ContestacoesList itensIniciais={itens} />
    </div>
  )
}
