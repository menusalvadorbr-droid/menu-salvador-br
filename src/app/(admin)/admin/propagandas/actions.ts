'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'

export async function criarPropaganda(formData: FormData) {
  const { supabase, userId } = await checarSuperAdmin()

  const dataInicio = formData.get('data_inicio') as string
  const dataFim = formData.get('data_fim') as string
  const titulo = formData.get('titulo') as string

  const { data: propaganda, error } = await supabase
    .from('propagandas')
    .insert({
      titulo,
      descricao: formData.get('descricao'),
      imagem: formData.get('imagem') || null,
      link: formData.get('link') || null,
      ativa: true,
      ordem: 0,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'propaganda_criada',
    target_type: 'propagandas',
    target_id: propaganda?.id,
    new_data: { titulo, data_inicio: dataInicio || null, data_fim: dataFim || null },
  })

  revalidatePath('/admin/propagandas')
}

export async function alternarPropaganda(id: string, ativa: boolean) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase.from('propagandas').update({ ativa }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: ativa ? 'propaganda_ativada' : 'propaganda_desativada',
    target_type: 'propagandas',
    target_id: id,
  })

  revalidatePath('/admin/propagandas')
}

export async function removerPropaganda(id: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase.from('propagandas').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'propaganda_removida',
    target_type: 'propagandas',
    target_id: id,
  })

  revalidatePath('/admin/propagandas')
}
