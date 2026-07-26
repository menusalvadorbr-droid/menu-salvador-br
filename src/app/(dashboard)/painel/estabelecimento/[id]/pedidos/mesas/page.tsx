import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import MapaMesas from '@/modules/pedidos/mesas/components/MapaMesas'
import Link from 'next/link'

export default async function MesasEstabelecimentoPage({
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
    .select('id, nome, nome_fantasia')
    .eq('id', id)
    .single()

  if (!estabelecimento) notFound()

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <Link href={`/painel/estabelecimento/${id}/pedidos`} className="text-sm text-neutral-500 hover:text-orange-600">
          ← Voltar aos pedidos
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Mesas — {estabelecimento.nome_fantasia || estabelecimento.nome}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Toque numa mesa pra lançar um pedido direto pra ela.
        </p>

        <div className="mt-6">
          <MapaMesas estabelecimentoId={id} />
        </div>
      </div>
    </div>
  )
}
