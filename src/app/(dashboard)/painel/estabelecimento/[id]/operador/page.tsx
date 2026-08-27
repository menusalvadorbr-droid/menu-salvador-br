import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import FilaOperador from '@/modules/operador/components/FilaOperador'

export default async function OperadorPage({
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

  // Checagem detalhada de permissão (dono/funcionário/super_admin) já é
  // reforçada pela RLS de whatsapp_conversas/orders/validacao_pedidos —
  // aqui é só uma tela vazia caso a pessoa não tenha acesso.
  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <Link href={`/painel/estabelecimento/${id}/gerenciar`} className="text-sm text-neutral-500 hover:text-orange-600">
          ← Voltar ao gerenciamento
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Fila do Operador — {estabelecimento.nome_fantasia || estabelecimento.nome}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Atualiza sozinho em tempo real.</p>

        <div className="mt-6">
          <FilaOperador estabelecimentoId={id} />
        </div>
      </div>
    </div>
  )
}
