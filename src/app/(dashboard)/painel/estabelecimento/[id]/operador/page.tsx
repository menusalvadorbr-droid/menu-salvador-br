import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CentralOperador from '@/modules/operador/components/CentralOperador'
import IndicadorStatusSistema from '@/modules/operador/components/IndicadorStatusSistema'
import GestaoNav from '../gerenciar/GestaoNav'

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
  //
  // Cabeçalho alinhado ao mesmo padrão que Pedidos/Estoque/Fornecedores já
  // usam ("Voltar ao gerenciamento" + h1 + subtítulo) — antes esta tela e
  // /conversas tinham um card próprio, copiado uma da outra, diferente de
  // todo o resto do módulo Gestão (sem h1 nem subtítulo explicando a
  // tela). O aviso ao lado do título era decorativo ("atualiza em tempo
  // real", sempre igual) — agora é IndicadorStatusSistema, que reflete de
  // verdade se o canal Realtime está inscrito e se o WhatsApp deste
  // estabelecimento está conectado.
  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <Link href={`/painel/estabelecimento/${id}/gerenciar`} className="text-sm text-neutral-500 hover:text-orange-600">
          ← Voltar ao gerenciamento
        </Link>
        <div className="mt-1 flex items-baseline gap-2.5">
          <h1 className="text-2xl font-bold text-neutral-900">Central do Operador</h1>
          <IndicadorStatusSistema estabelecimentoId={id} />
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Fila priorizada de pendências e todas as conversas de WhatsApp de {estabelecimento.nome_fantasia || estabelecimento.nome}, num só lugar.
        </p>
        <GestaoNav estabelecimentoId={id} />

        <div className="mt-6">
          <CentralOperador estabelecimentoId={id} />
        </div>
      </div>
    </div>
  )
}
