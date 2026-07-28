'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'

// ============================================================
// FUNÇÃO: Moderar estabelecimento (aprovar, bloquear, desbloquear, desvincular)
// ============================================================

const ACAO_PARA_LOG: Record<string, string> = {
  approve: 'estabelecimento_aprovado',
  block: 'estabelecimento_bloqueado',
  unblock: 'estabelecimento_desbloqueado',
  unlink: 'estabelecimento_desvinculado',
  restore: 'estabelecimento_restaurado',
}

export async function moderarEstabelecimento(id: string, acao: 'approve' | 'block' | 'unblock' | 'unlink' | 'restore') {
  const { supabase, userId } = await checarSuperAdmin()

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
    case 'restore':
      // Estabelecimento que o próprio dono marcou como excluído
      // (painel/actions.ts) — volta a ficar visível pro dono e ao público,
      // mantendo o mesmo owner_user_id de antes (não foi desvinculado).
      updateData = { status: 'active', ativo: true }
      break
  }

  // Busca o estado anterior pra registrar no audit_log e pra conseguirmos
  // diferenciar "não achou a linha" de "RLS bloqueou a escrita".
  const { data: anterior } = await supabase
    .from('estabelecimentos')
    .select('status, ativo, owner_user_id')
    .eq('id', id)
    .single()

  const { data: atualizado, error } = await supabase
    .from('estabelecimentos')
    .update(updateData)
    .eq('id', id)
    .select('id, status, ativo, owner_user_id')
    .single()

  if (error) throw new Error(error.message)

  // Se o update "passou" sem erro mas não retornou linha, quase sempre é
  // RLS barrando silenciosamente (0 linhas afetadas) — melhor avisar
  // explicitamente do que deixar parecer que funcionou.
  if (!atualizado) {
    throw new Error(
      'A atualização não retornou dados. Verifique se existe uma policy de RLS liberando super_admin em "estabelecimentos".'
    )
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: ACAO_PARA_LOG[acao] ?? 'estabelecimento_moderado',
    target_type: 'estabelecimentos',
    target_id: id,
    old_data: anterior ?? null,
    new_data: atualizado,
  })

  revalidatePath('/admin/estabelecimentos')
  revalidatePath('/admin')
  revalidatePath('/admin/logs')
}

// ============================================================
// FUNÇÃO: Excluir estabelecimento (permanente)
// ============================================================

export async function excluirEstabelecimento(id: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('nome, slug, status')
    .eq('id', id)
    .single()

  const { error, count } = await supabase
    .from('estabelecimentos')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) {
    // Erro de FK (dependências como pedidos, categorias, etc. impedindo o
    // delete) tem uma mensagem técnica do Postgres. Traduzimos pra algo
    // que o admin realmente entende, em vez de deixar o alert() genérico
    // mostrar "violates foreign key constraint ...".
    if (error.message.toLowerCase().includes('foreign key')) {
      throw new Error(
        'Não é possível excluir: este estabelecimento ainda tem dados vinculados (pedidos, cardápio, funcionários, etc). Bloqueie o estabelecimento em vez de excluir, ou remova as dependências primeiro.'
      )
    }
    throw new Error(error.message)
  }

  if (!count) {
    throw new Error(
      'Nenhuma linha foi excluída. Verifique se existe uma policy de RLS liberando super_admin em "estabelecimentos".'
    )
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_excluido',
    target_type: 'estabelecimentos',
    target_id: id,
    old_data: estabelecimento ?? null,
  })

  revalidatePath('/admin/estabelecimentos')
  revalidatePath('/admin')
  revalidatePath('/admin/logs')
}
