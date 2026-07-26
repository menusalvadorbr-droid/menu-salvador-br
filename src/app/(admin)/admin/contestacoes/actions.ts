'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function transferirVinculo(contestacaoId: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { data: contestacao } = await supabase
    .from('vinculo_contestacoes')
    .select('id, estabelecimento_id, usuario_id, status')
    .eq('id', contestacaoId)
    .maybeSingle()

  if (!contestacao) throw new Error('Contestação não encontrada.')
  if (contestacao.status !== 'pending') throw new Error('Essa contestação já foi resolvida.')

  // Usa service role de propósito: transferir dono é uma operação
  // sensível que só o admin decide, por isso passa por aqui em vez de
  // depender de uma policy de RLS permissiva pra troca de owner_user_id.
  const { error: estError } = await supabaseAdmin
    .from('estabelecimentos')
    .update({ owner_user_id: contestacao.usuario_id })
    .eq('id', contestacao.estabelecimento_id)
  if (estError) throw new Error(estError.message)

  const { error: contestacaoError } = await supabaseAdmin
    .from('vinculo_contestacoes')
    .update({ status: 'transferido', resolvido_por: userId, resolvido_em: new Date().toISOString() })
    .eq('id', contestacaoId)
  if (contestacaoError) throw new Error(contestacaoError.message)

  await supabaseAdmin.from('audit_logs').insert({
    usuario_id: userId,
    action: 'contestacao_transferida',
    target_type: 'estabelecimentos',
    target_id: contestacao.estabelecimento_id,
    new_data: { novo_owner: contestacao.usuario_id },
  })

  revalidatePath('/admin/contestacoes')
}

export async function descartarContestacao(contestacaoId: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase
    .from('vinculo_contestacoes')
    .update({ status: 'descartado', resolvido_por: userId, resolvido_em: new Date().toISOString() })
    .eq('id', contestacaoId)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'contestacao_descartada',
    target_type: 'vinculo_contestacoes',
    target_id: contestacaoId,
  })

  revalidatePath('/admin/contestacoes')
}
