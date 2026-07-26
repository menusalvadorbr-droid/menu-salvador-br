'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'
import { gerarSlug } from '@/lib/slug'

// Desativar em vez de apagar de verdade: tipo_cozinha_id tem FK em
// estabelecimento_tipos_cozinha (delete em cascata apagaria o vínculo
// de todo mundo que usa esse tipo, sem aviso nenhum). Desativado só
// some das opções pra escolher de novo, sem afetar quem já usa.

export async function criarTipoEstabelecimento(nome: string, icone: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const slug = gerarSlug(nome)

  const { error } = await supabase.from('tipos_estabelecimento').insert({ nome: nome.trim(), slug, icone: icone.trim() || null })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_estabelecimento_criado',
    target_type: 'tipos_estabelecimento',
    new_data: { nome, slug, icone },
  })

  revalidatePath('/admin/tipos')
}

export async function toggleTipoEstabelecimento(id: number, ativo: boolean) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase.from('tipos_estabelecimento').update({ ativo }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: ativo ? 'tipo_estabelecimento_ativado' : 'tipo_estabelecimento_desativado',
    target_type: 'tipos_estabelecimento',
    target_id: String(id),
  })

  revalidatePath('/admin/tipos')
}

export async function editarTipoEstabelecimento(id: number, nome: string, icone: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase
    .from('tipos_estabelecimento')
    .update({ nome: nome.trim(), icone: icone.trim() || null })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_estabelecimento_editado',
    target_type: 'tipos_estabelecimento',
    target_id: String(id),
    new_data: { nome, icone },
  })

  revalidatePath('/admin/tipos')
}

export async function excluirTipoEstabelecimento(id: number) {
  const { supabase, userId } = await checarSuperAdmin()

  // Não é FK (tipo_estabelecimento é texto livre em estabelecimentos),
  // então excluir aqui não desvincula nem apaga estabelecimento nenhum
  // — só some da lista de opções pra escolher.
  const { error } = await supabase.from('tipos_estabelecimento').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_estabelecimento_excluido',
    target_type: 'tipos_estabelecimento',
    target_id: String(id),
  })

  revalidatePath('/admin/tipos')
}

export async function criarTipoCozinha(nome: string, icone: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const slug = gerarSlug(nome)

  const { error } = await supabase.from('tipos_cozinha').insert({ nome: nome.trim(), slug, icone: icone.trim() || null })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_cozinha_criado',
    target_type: 'tipos_cozinha',
    new_data: { nome, slug, icone },
  })

  revalidatePath('/admin/tipos')
}

export async function toggleTipoCozinha(id: number, ativo: boolean) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase.from('tipos_cozinha').update({ ativo }).eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: ativo ? 'tipo_cozinha_ativado' : 'tipo_cozinha_desativado',
    target_type: 'tipos_cozinha',
    target_id: String(id),
  })

  revalidatePath('/admin/tipos')
}

export async function editarTipoCozinha(id: number, nome: string, icone: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase
    .from('tipos_cozinha')
    .update({ nome: nome.trim(), icone: icone.trim() || null })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_cozinha_editado',
    target_type: 'tipos_cozinha',
    target_id: String(id),
    new_data: { nome, icone },
  })

  revalidatePath('/admin/tipos')
}

export async function excluirTipoCozinha(id: number) {
  const { supabase, userId } = await checarSuperAdmin()

  // Diferente de tipos_estabelecimento: aqui existe FK de verdade
  // (estabelecimento_tipos_cozinha.tipo_cozinha_id, on delete cascade)
  // — excluir remove o vínculo de TODOS os estabelecimentos que usam
  // esse tipo. O aviso disso é mostrado no cliente antes de chamar isso.
  const { error } = await supabase.from('tipos_cozinha').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'tipo_cozinha_excluido',
    target_type: 'tipos_cozinha',
    target_id: String(id),
  })

  revalidatePath('/admin/tipos')
}
