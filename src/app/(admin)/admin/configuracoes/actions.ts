'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function checarSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') throw new Error('Permissão negada')
  return supabase
}

export async function alternarSecao(id: string, ativa: boolean) {
  const supabase = await checarSuperAdmin()
  const { error } = await supabase
    .from('secoes_estabelecimento_config')
    .update({ ativa })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function reordenarSecao(id: string, novaOrdem: number) {
  const supabase = await checarSuperAdmin()
  const { error } = await supabase
    .from('secoes_estabelecimento_config')
    .update({ ordem: novaOrdem })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}

export async function salvarPaleta(corPrimaria: string, corSecundaria: string) {
  const supabase = await checarSuperAdmin()
  const { error } = await supabase
    .from('configuracoes_plataforma')
    .upsert({ id: 1, cor_primaria: corPrimaria, cor_secundaria: corSecundaria })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/configuracoes')
}
