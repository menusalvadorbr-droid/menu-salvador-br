import { createClient } from '@/lib/supabase/server'

/**
 * Confirma que quem está chamando essa server action é super_admin —
 * usado em toda ação sensível do painel admin. Antes essa mesma função
 * estava copiada em 10 arquivos de actions.ts diferentes; centralizada
 * aqui pra mudar a regra (ex: quando existir admin_plataforma com
 * permissões por seção) num lugar só, não em 10.
 */
export async function checarSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')

  return { supabase, userId: user.id }
}
