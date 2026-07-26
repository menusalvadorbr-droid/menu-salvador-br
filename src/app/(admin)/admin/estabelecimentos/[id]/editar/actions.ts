'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { slugify } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

interface AtualizarEstabelecimentoAdminInput {
  estabelecimentoId: string
  nomeFantasia: string
  endereco: string
  cep: string
  bairroId: string | null
  bairroNome: string
  cidade: string
  slug: string
  telefone: string
  whatsapp: string
  instagram: string
  tipoEstabelecimento: string
  tipoLogradouro: string
  linkGoogleMaps: string
}

export async function atualizarEstabelecimentoAdmin(input: AtualizarEstabelecimentoAdminInput) {
  const { supabase, userId } = await checarSuperAdmin()

  const slugNormalizado = slugify(input.slug)
  if (!slugNormalizado) throw new Error('Slug inválido.')
  if (!input.nomeFantasia?.trim()) throw new Error('Nome fantasia é obrigatório.')

  const { data: anterior } = await supabase
    .from('estabelecimentos')
    .select('nome_fantasia, endereco, cep, bairro, bairro_id, cidade, slug, telefone, whatsapp, instagram, tipo_estabelecimento, tipo_cozinha, tipo_logradouro, link_google_maps')
    .eq('id', input.estabelecimentoId)
    .single()

  // Se o slug mudou, checa duplicidade antes (mensagem melhor que o erro
  // cru de constraint do Postgres).
  if (slugNormalizado !== anterior?.slug) {
    const { data: emUso } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('slug', slugNormalizado)
      .neq('id', input.estabelecimentoId)
      .maybeSingle()

    if (emUso) {
      throw new Error(`O slug "${slugNormalizado}" já está em uso por outro estabelecimento.`)
    }
  }

  const { data: atualizado, error } = await supabase
    .from('estabelecimentos')
    .update({
      nome_fantasia: input.nomeFantasia.trim(),
      endereco: input.endereco || null,
      cep: input.cep || null,
      // Guarda os dois: bairro_id (usado pra montar a URL bonita
      // cidade/bairro/tipo/slug) e bairro em texto (usado em várias
      // listagens e cards que só leem o texto, sem fazer join).
      bairro_id: input.bairroId || null,
      bairro: input.bairroNome || null,
      cidade: input.cidade || null,
      slug: slugNormalizado,
      telefone: input.telefone || null,
      whatsapp: input.whatsapp || null,
      instagram: input.instagram || null,
      tipo_estabelecimento: input.tipoEstabelecimento || null,
      tipo_logradouro: input.tipoLogradouro || null,
      link_google_maps: input.linkGoogleMaps || null,
    })
    .eq('id', input.estabelecimentoId)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  if (!atualizado) {
    throw new Error(
      'A atualização não retornou dados. Verifique a policy de RLS de super_admin em "estabelecimentos".'
    )
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_editado_pelo_admin',
    target_type: 'estabelecimentos',
    target_id: input.estabelecimentoId,
    old_data: anterior,
    new_data: { ...input, slug: slugNormalizado },
  })

  revalidatePath('/admin/estabelecimentos')
  revalidatePath(`/admin/estabelecimentos/${input.estabelecimentoId}/editar`)
  revalidatePath(`/admin/estabelecimentos/${input.estabelecimentoId}/analisar`)
  revalidatePath(`/${slugNormalizado}`)
  revalidatePath(`/cardapio/${slugNormalizado}`)

  return { slug: slugNormalizado }
}
