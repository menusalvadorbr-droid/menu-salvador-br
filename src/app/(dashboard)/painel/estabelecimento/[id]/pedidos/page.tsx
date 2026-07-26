import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PainelComandas from '@/modules/pedidos/components/PainelComandas'
import BotaoVendaBalcao from '@/modules/pedidos/components/BotaoVendaBalcao'
import Link from 'next/link'

export default async function PedidosEstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('id, nome, nome_fantasia, owner_user_id')
    .eq('id', id)
    .single()

  if (!estabelecimento) notFound()

  // A checagem detalhada de permissão (dono/funcionário/membro) já é
  // reforçada pela RLS da tabela orders — aqui é só uma tela vazia caso
  // a pessoa não tenha acesso, sem vazar dados de outro estabelecimento.
  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <Link href={`/painel/estabelecimento/${id}/gerenciar`} className="text-sm text-neutral-500 hover:text-orange-600">
          ← Voltar ao gerenciamento
        </Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">
            Pedidos — {estabelecimento.nome_fantasia || estabelecimento.nome}
          </h1>
          <div className="flex gap-2">
            <BotaoVendaBalcao estabelecimentoId={id} />
            <Link
              href={`/painel/estabelecimento/${id}/pedidos/mesas`}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
            >
              🪑 Mesas
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-neutral-500">Atualiza sozinho em tempo real.</p>

        <div className="mt-6">
          <PainelComandas estabelecimentoId={id} />
        </div>
      </div>
    </div>
  )
}
