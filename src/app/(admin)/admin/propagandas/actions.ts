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

export async function criarPropaganda(formData: FormData) {
  const supabase = await checarSuperAdmin()

  const dataInicio = formData.get('data_inicio') as string
  const dataFim = formData.get('data_fim') as string

  const { error } = await supabase.from('propagandas').insert({
    titulo: formData.get('titulo'),
    descricao: formData.get('descricao'),
    imagem: formData.get('imagem') || null,
    link: formData.get('link') || null,
    ativa: true,
    ordem: 0,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/propagandas')
}

export async function alternarPropaganda(id: string, ativa: boolean) {
  const supabase = await checarSuperAdmin()
  const { error } = await supabase.from('propagandas').update({ ativa }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propagandas')
}

export async function removerPropaganda(id: string) {
  const supabase = await checarSuperAdmin()
  const { error } = await supabase.from('propagandas').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/propagandas')
}
