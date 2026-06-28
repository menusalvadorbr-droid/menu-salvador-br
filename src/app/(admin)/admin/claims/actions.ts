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
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  // Atualiza a claim (usando as colunas corretas)
  const updateData: any = {
    status: acao === 'approve' ? 'approved' : 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }

  const { error: claimError } = await supabase
    .from('restaurant_claims')
    .update(updateData)
    .eq('id', claimId)

  if (claimError) throw new Error(claimError.message)

  // Se aprovou, atualiza o estabelecimento
  if (acao === 'approve') {
    const { error: estError } = await supabase
      .from('estabelecimentos')
      .update({
        owner_user_id: usuarioId,
        status: 'active',
        ativo: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', estabelecimentoId)

    if (estError) throw new Error(estError.message)
  }

  // Se rejeitou, desvincula o dono (se já tiver sido vinculado)
  if (acao === 'reject') {
    const { error: estError } = await supabase
      .from('estabelecimentos')
      .update({
        owner_user_id: null,
        status: 'pending_review',
        ativo: false,
        approved_at: null,
        approved_by: null,
      })
      .eq('id', estabelecimentoId)

    if (estError) throw new Error(estError.message)
  }

  revalidatePath('/admin/claims')
  revalidatePath('/admin/estabelecimentos')
  redirect('/admin/claims')
}