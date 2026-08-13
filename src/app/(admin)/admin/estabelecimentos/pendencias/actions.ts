'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'
import { gerarSlug } from '@/lib/slug'

/**
 * Vincula um estabelecimento pendente (bairro_id nulo) a um bairro já
 * cadastrado. `bairro_informado` fica como estava — é o registro de
 * onde essa vinculação veio, não é apagado ao resolver.
 */
export async function vincularBairroExistente(estabelecimentoId: string, bairroId: string) {
  const { supabase, userId } = await checarSuperAdmin()

  const { error } = await supabase.from('estabelecimentos').update({ bairro_id: bairroId }).eq('id', estabelecimentoId)
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_bairro_vinculado',
    target_type: 'estabelecimentos',
    target_id: estabelecimentoId,
    new_data: { bairroId },
  })

  revalidatePath('/admin/estabelecimentos/pendencias')
}

/**
 * Cadastra um bairro novo (a partir do bairro_informado — texto vindo da
 * Receita) na cidade do estabelecimento pendente, e já vincula os dois.
 */
export async function criarBairroEVincular(estabelecimentoId: string, cidadeId: string, nome: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const slug = gerarSlug(nome)

  const { data: bairro, error: erroBairro } = await supabase
    .from('bairros')
    .insert({ nome: nome.trim(), slug, cidade_id: cidadeId })
    .select('id')
    .single()
  if (erroBairro) {
    if (erroBairro.code === '23505') throw new Error('Já existe um bairro com esse nome nessa cidade.')
    throw new Error(erroBairro.message)
  }

  const { error: erroVinculo } = await supabase
    .from('estabelecimentos')
    .update({ bairro_id: bairro.id })
    .eq('id', estabelecimentoId)
  if (erroVinculo) throw new Error(erroVinculo.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_bairro_criado_e_vinculado',
    target_type: 'estabelecimentos',
    target_id: estabelecimentoId,
    new_data: { cidadeId, nome, slug, bairroId: bairro.id },
  })

  revalidatePath('/admin/estabelecimentos/pendencias')
  revalidatePath('/admin/bairros')
  revalidatePath('/admin/tipos')
}
