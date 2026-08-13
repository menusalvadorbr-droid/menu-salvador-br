'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'
import { gerarSlug } from '@/lib/slug'

// cidades é a lista de cobertura do menu.salvador — só cidades cadastradas
// aqui aparecem como opção no cadastro por CNPJ; CNPJ de fora dessa lista
// interrompe o cadastro com aviso de "fora de cobertura" (ver
// src/lib/resolverCidadeCadastro.ts).

export async function criarCidade(nome: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const slug = gerarSlug(nome)

  const { data, error } = await supabase
    .from('cidades')
    .insert({ nome: nome.trim(), slug })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('Já existe uma cidade com esse nome.')
    throw new Error(error.message)
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'cidade_criada',
    target_type: 'cidades',
    target_id: data.id,
    new_data: { nome, slug },
  })

  revalidatePath('/admin/cidades')
  revalidatePath('/admin/tipos')
  revalidatePath('/admin/bairros')
  return { id: data.id as string, slug }
}

export async function editarCidade(id: string, nome: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase.from('cidades').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'cidade_editada',
    target_type: 'cidades',
    target_id: id,
    new_data: { nome },
  })

  revalidatePath('/admin/cidades')
  revalidatePath('/admin/tipos')
  revalidatePath('/admin/bairros')
}

export async function removerCidade(id: string) {
  const { supabase, userId } = await checarSuperAdmin()

  // bairros.cidade_id e estabelecimentos.cidade_id apontam pra cá sem
  // "on delete cascade" (ver migração 20260807_slugs_canonicos.sql) —
  // remover uma cidade com bairro/estabelecimento vinculado falha na FK
  // em vez de apagar em cascata. O aviso é mostrado no cliente antes de
  // chamar isso, mas o banco é quem garante de verdade.
  const { error } = await supabase.from('cidades').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('Essa cidade tem bairro ou estabelecimento vinculado — desvincule antes de remover.')
    }
    throw new Error(error.message)
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'cidade_removida',
    target_type: 'cidades',
    target_id: id,
  })

  revalidatePath('/admin/cidades')
  revalidatePath('/admin/tipos')
  revalidatePath('/admin/bairros')
}
