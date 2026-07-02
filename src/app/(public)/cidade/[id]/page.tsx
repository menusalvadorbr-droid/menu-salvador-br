import { createClient } from '@/lib/supabase/server'
import SecaoPublicaCidade from './SecaoPublica'
import SectionHeading from '@/components/public/SectionHeading'

export default async function PaginaCidade({ params }: { params: Promise<{ id: string }> }) {
  const { id: cidadeId } = await params
  const supabase = await createClient()

  const { data: cidade } = await supabase
    .from('cidades')
    .select('*')
    .eq('id', cidadeId)
    .single()

  const { data: secoes } = await supabase
    .from('secoes_publicas')
    .select('*')
    .eq('cidade_id', cidadeId)
    .eq('ativa', true)
    .order('ordem', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-10">
      <SectionHeading title={cidade?.nome || 'Cidade'} subtitle={cidade?.estado ?? undefined} align="center" />

      {secoes?.map((secao) => (
        <SecaoPublicaCidade key={secao.id} tipo={secao.nome_secao} cidadeId={cidadeId} />
      ))}

      {(!secoes || secoes.length === 0) && (
        <p className="py-12 text-center text-neutral-500">
          Nenhuma seção publicada para esta cidade ainda.
        </p>
      )}
    </div>
  )
}
