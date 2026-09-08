'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'
import { gerarSlug } from '@/lib/slug'

// Devolve o id do bairro criado — usado pelo cadastro de estabelecimento
// (CNPJ) pra já apontar pro bairro novo sem precisar recarregar a lista.
// BairrosManager.tsx (chamador original) ignora o retorno, então isso não
// muda nada pra quem já usava essa action.
export async function criarBairro(nome: string, icone: string, cidadeId: string): Promise<{ id: string }> {
  const { supabase, userId } = await checarSuperAdmin()
  const slug = gerarSlug(nome)

  if (!cidadeId) throw new Error('Selecione a cidade do bairro.')

  const { data, error } = await supabase
    .from('bairros')
    .insert({ nome: nome.trim(), slug, icone: icone.trim() || null, cidade_id: cidadeId })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'bairro_criado',
    target_type: 'bairros',
    new_data: { nome, slug, icone, cidadeId },
  })

  revalidatePath('/admin/bairros')
  revalidatePath('/admin/tipos')

  return { id: data.id }
}

export async function editarBairro(id: string, nome: string, icone: string, cidadeId: string) {
  const { supabase, userId } = await checarSuperAdmin()

  if (!cidadeId) throw new Error('Selecione a cidade do bairro.')

  const { error } = await supabase
    .from('bairros')
    .update({ nome: nome.trim(), icone: icone.trim() || null, cidade_id: cidadeId })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'bairro_editado',
    target_type: 'bairros',
    target_id: id,
    new_data: { nome, icone, cidadeId },
  })

  revalidatePath('/admin/bairros')
  revalidatePath('/admin/tipos')
}

export async function removerBairro(id: string) {
  const { supabase, userId } = await checarSuperAdmin()

  // Estabelecimentos vinculados a esse bairro ficam sem bairro_id
  // (on delete set null na FK) — não apaga estabelecimento nenhum,
  // só desvincula. O dono precisa escolher outro bairro depois.
  const { error } = await supabase.from('bairros').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'bairro_removido',
    target_type: 'bairros',
    target_id: id,
  })

  revalidatePath('/admin/bairros')
  revalidatePath('/admin/tipos')
}
