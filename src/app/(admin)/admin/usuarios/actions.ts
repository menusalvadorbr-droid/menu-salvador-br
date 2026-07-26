'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function alterarRole(usuarioId: string, novoRole: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  // Impede que o único super_admin remova a própria permissão sem querer
  if (usuarioId === user.id && novoRole !== 'super_admin') {
    throw new Error('Você não pode remover sua própria permissão de super_admin por aqui.')
  }

  const { data: usuarioAnterior } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', usuarioId)
    .single()

  const { error } = await supabase.from('profiles').update({ role: novoRole }).eq('id', usuarioId)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: user.id,
    action: 'usuario_role_alterada',
    target_type: 'profiles',
    target_id: usuarioId,
    old_data: { role: usuarioAnterior?.role },
    new_data: { role: novoRole },
  })

  revalidatePath('/admin/usuarios')
}
