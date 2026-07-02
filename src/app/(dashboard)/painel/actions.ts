'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ============================================================
// SERVER ACTION: LOGOUT
// ============================================================
export async function handleLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// SERVER ACTION: TOGGLE OCULTAR
// ============================================================
export async function toggleOcultar(formData: FormData) {
  const id = formData.get('id') as string
  const ativo = formData.get('ativo') === 'true'
  const supabase = await createClient()
  await supabase
    .from('estabelecimentos')
    .update({ ativo: !ativo })
    .eq('id', id)
  redirect('/painel')
}

// ============================================================
// SERVER ACTION: EXCLUIR (soft delete)
// ============================================================
export async function excluirEstabelecimento(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase
    .from('estabelecimentos')
    .update({ status: 'inactive', ativo: false })
    .eq('id', id)
  redirect('/painel')
}
