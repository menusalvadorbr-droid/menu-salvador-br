'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { limparCnpj } from '@/lib/cnpj'
import { slugify } from '@/lib/utils'
import { redirect } from 'next/navigation'

interface CriarEstabelecimentoAdminInput {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string | null
  atividadeEconomica: string | null
  cnaeCodigo: string | null
  tipoLogradouro: string | null
  endereco: string | null
  numero: string | null
  cep: string | null
  cidade: string | null
  dataAbertura: string | null
  opcaoPeloSimples: boolean | null
  dataOpcaoPeloSimples: string | null
  socios: unknown
  telefone: string
  whatsapp: string
}

export async function criarEstabelecimentoAdmin(input: CriarEstabelecimentoAdminInput) {
  const { supabase, userId } = await checarSuperAdmin()

  const cnpjLimpo = limparCnpj(input.cnpj)
  if (!input.razaoSocial?.trim()) throw new Error('Razão social é obrigatória.')
  if (!input.nomeFantasia?.trim()) throw new Error('Nome fantasia é obrigatório.')

  const { data: existenteCnpj } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('cnpj', cnpjLimpo)
    .maybeSingle()

  if (existenteCnpj) {
    throw new Error('Já existe um estabelecimento cadastrado com esse CNPJ.')
  }

  const baseSlug = slugify(input.nomeFantasia)
  let slugFinal = baseSlug
  let tentativa = 0
  while (tentativa < 20) {
    const { data: existente } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('slug', slugFinal)
      .maybeSingle()
    if (!existente) break
    tentativa += 1
    slugFinal = `${baseSlug}-${tentativa + 1}`
  }

  // Inserido sem owner_user_id — fica público no diretório (status
  // active/ativo true) esperando alguém reivindicar via /claim, igual a
  // qualquer outro estabelecimento sem dono.
  const { data: novoEstabelecimento, error } = await supabase
    .from('estabelecimentos')
    .insert({
      nome: input.razaoSocial.trim(),
      nome_fantasia: input.nomeFantasia.trim(),
      razao_social: input.razaoSocial.trim(),
      cnpj: cnpjLimpo,
      situacao_cadastral: input.situacaoCadastral,
      atividade_economica: input.atividadeEconomica,
      cnae_codigo: input.cnaeCodigo,
      tipo_logradouro: input.tipoLogradouro,
      endereco: input.endereco,
      numero: input.numero,
      cep: input.cep,
      cidade: input.cidade || 'Salvador',
      data_abertura: input.dataAbertura,
      opcao_pelo_simples: input.opcaoPeloSimples,
      data_opcao_pelo_simples: input.dataOpcaoPeloSimples,
      socios: input.socios ?? null,
      telefone: input.telefone || null,
      whatsapp: input.whatsapp || null,
      slug: slugFinal,
      status: 'active',
      ativo: true,
      owner_user_id: null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_criado_pelo_admin',
    target_type: 'estabelecimentos',
    target_id: novoEstabelecimento.id,
    new_data: { nome_fantasia: input.nomeFantasia, cnpj: cnpjLimpo },
  })

  redirect('/admin/estabelecimentos')
}
