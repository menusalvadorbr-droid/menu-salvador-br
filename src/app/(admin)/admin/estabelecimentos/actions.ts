'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// FUNÇÃO: Moderar estabelecimento (aprovar, bloquear, desbloquear, desvincular)
// ============================================================

export async function moderarEstabelecimento(id: string, acao: 'approve' | 'block' | 'unblock' | 'unlink') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  let updateData: any = {}

  switch (acao) {
    case 'approve':
      updateData = { status: 'active', ativo: true }
      break
    case 'block':
      updateData = { status: 'blocked', ativo: false }
      break
    case 'unblock':
      updateData = { status: 'active', ativo: true }
      break
    case 'unlink':
      updateData = { owner_user_id: null }
      break
  }

  const { error } = await supabase
    .from('estabelecimentos')
    .update(updateData)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estabelecimentos')
  revalidatePath('/admin')
}

// ============================================================
// FUNÇÃO: Excluir estabelecimento (permanente)
// ============================================================

export async function excluirEstabelecimento(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  // Verifica se há dependências (pedidos, etc.) – opcional

  const { error } = await supabase
    .from('estabelecimentos')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/estabelecimentos')
  revalidatePath('/admin')
}