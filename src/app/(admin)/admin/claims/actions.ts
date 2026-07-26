'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function moderarClaim(
  claimId: string,
  acao: 'approve' | 'reject',
  estabelecimentoId: string,
  usuarioId: string
) {
  const supabase = await createClient()

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Verifica se é super_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  // Atualiza a claim (usando as colunas reais de restaurant_claims —
  // não existem reviewed_by/reviewed_at, o campo certo é respondido_em)
  const { error: claimError } = await supabase
    .from('restaurant_claims')
    .update({
      status: acao === 'approve' ? 'approved' : 'rejected',
      respondido_em: new Date().toISOString(),
    })
    .eq('id', claimId)

  if (claimError) throw new Error(claimError.message)

  // Se aprovou, confirma o dono e publica o estabelecimento de novo.
  // Se rejeitou, desfaz o vínculo provisório criado no envio da
  // reivindicação (moderarEstabelecimento/claim já deixa o
  // estabelecimento em 'em_analise' com owner_user_id preenchido assim
  // que a solicitação é enviada — antes mesmo da aprovação). Só desfaz
  // se o dono atual ainda for esse mesmo usuário, pra nunca mexer sem
  // querer num vínculo diferente que possa ter sido criado depois.
  if (acao === 'approve') {
    const { data: estAtualizado, error: estError } = await supabase
      .from('estabelecimentos')
      .update({
        owner_user_id: usuarioId,
        status: 'active',
        ativo: true,
      })
      .eq('id', estabelecimentoId)
      .select('id')
      .single()

    if (estError) throw new Error(estError.message)

    // Sem isso, uma policy de RLS faltando bloqueia o update silenciosamente
    // (nenhum erro, nenhuma linha afetada) e a claim fica marcada como
    // aprovada com o estabelecimento nunca de fato vinculado/ativado.
    if (!estAtualizado) {
      throw new Error(
        'A claim não pôde ser totalmente aplicada: o estabelecimento não foi atualizado. Verifique a policy de RLS de super_admin em "estabelecimentos".'
      )
    }
  } else {
    const { error: estError } = await supabase
      .from('estabelecimentos')
      .update({
        owner_user_id: null,
        status: 'active',
        ativo: true,
      })
      .eq('id', estabelecimentoId)
      .eq('owner_user_id', usuarioId) // só desfaz se o dono ainda for quem abriu esse claim
      .eq('status', 'em_analise')      // e só se ainda estiver no estado provisório da reivindicação

    if (estError) throw new Error(estError.message)
    // Sem linha afetada aqui não é erro: pode ser um claim antigo (de
    // antes dessa mudança) num estabelecimento que já não está mais em
    // 'em_analise' — nesse caso não há nada pra reverter.
  }

  // Registra a ação no log de auditoria da plataforma
  await supabase.from('audit_logs').insert({
    usuario_id: user.id,
    action: acao === 'approve' ? 'claim_approved' : 'claim_rejected',
    target_type: 'restaurant_claims',
    target_id: claimId,
    new_data: { status: acao === 'approve' ? 'approved' : 'rejected', estabelecimento_id: estabelecimentoId },
  })

  revalidatePath('/admin/claims')
  revalidatePath('/admin/estabelecimentos')
  redirect('/admin/claims')
}
