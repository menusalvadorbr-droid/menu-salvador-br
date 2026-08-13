'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { limparCnpj } from '@/lib/cnpj'
import { gerarSlug } from '@/lib/slug'
import { consultarCnpjCompleto } from '@/lib/brasilapi'
import { resolverCidadeCobertura, encontrarBairroNaCidade } from '@/lib/resolverCidadeCadastro'

export interface HorarioImportado {
  diaSemana: number
  horarioAbertura: string
  horarioFechamento: string
  fechado: boolean
}

interface CriarEstabelecimentoImportadoInput {
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
  cidadeId: string
  dataAbertura: string | null
  opcaoPeloSimples: boolean | null
  dataOpcaoPeloSimples: string | null
  socios: unknown
  telefone: string
  whatsapp: string
  bairroId: string | null
  bairroInformado: string | null
  tipoEstabelecimentoId: number
  tipoEstabelecimentoSlug: string
  culinariaIds: number[]
  linkGoogleMaps: string
  horarios: HorarioImportado[]
  galeriaFotos: string[]
}

/**
 * Busca o CNPJ na BrasilAPI e já avisa se esse CNPJ (ou uma tentativa
 * anterior descartada dele) já está no diretório — evita duplicar ao
 * processar uma lista colada pelo admin.
 */
export async function consultarCnpjParaImportacao(cnpj: string) {
  const { supabase } = await checarSuperAdmin()
  const cnpjLimpo = limparCnpj(cnpj)

  const { data: existente } = await supabase
    .from('estabelecimentos')
    .select('id, nome_fantasia, slug')
    .eq('cnpj', cnpjLimpo)
    .maybeSingle()

  if (existente) {
    return { jaExiste: true as const, existente }
  }

  const dados = await consultarCnpjCompleto(cnpjLimpo)

  // Fora de cobertura interrompe esse item da fila (vira 'erro' na UI,
  // o admin pula ou descarta) — sem find-or-create, ver
  // src/lib/resolverCidadeCadastro.ts.
  const cidade = await resolverCidadeCobertura(supabase, dados.cidade)
  const bairroId = await encontrarBairroNaCidade(supabase, dados.bairro, cidade.id)

  return { jaExiste: false as const, dados, cidadeId: cidade.id, cidadeNome: cidade.nome, bairroId }
}

export async function criarEstabelecimentoImportado(input: CriarEstabelecimentoImportadoInput) {
  const { supabase, userId } = await checarSuperAdmin()

  const cnpjLimpo = limparCnpj(input.cnpj)
  if (!input.nomeFantasia?.trim()) throw new Error('Nome fantasia é obrigatório.')
  if (!input.tipoEstabelecimentoId) throw new Error('Tipo de estabelecimento é obrigatório.')
  if (!input.cidadeId) throw new Error('Cidade fora de cobertura.')

  const { data: existenteCnpj } = await supabase
    .from('estabelecimentos')
    .select('id')
    .eq('cnpj', cnpjLimpo)
    .maybeSingle()
  if (existenteCnpj) throw new Error('Já existe um estabelecimento cadastrado com esse CNPJ.')

  // Slug único por cidade (não globalmente) — mesmo nome pode existir em
  // cidades diferentes sem colidir.
  const baseSlug = gerarSlug(input.nomeFantasia)
  let slugFinal = baseSlug
  let tentativa = 0
  while (tentativa < 20) {
    const { data: existente } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('slug', slugFinal)
      .eq('cidade_id', input.cidadeId)
      .maybeSingle()
    if (!existente) break
    tentativa += 1
    slugFinal = `${baseSlug}-${tentativa + 1}`
  }

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
      cidade_id: input.cidadeId,
      data_abertura: input.dataAbertura,
      opcao_pelo_simples: input.opcaoPeloSimples,
      data_opcao_pelo_simples: input.dataOpcaoPeloSimples,
      socios: input.socios ?? null,
      telefone: input.telefone || null,
      whatsapp: input.whatsapp || null,
      bairro_id: input.bairroId,
      bairro_informado: input.bairroInformado,
      tipo_estabelecimento_id: input.tipoEstabelecimentoId,
      tipo_estabelecimento: input.tipoEstabelecimentoSlug,
      link_google_maps: input.linkGoogleMaps || null,
      galeria_fotos: input.galeriaFotos.length > 0 ? input.galeriaFotos : null,
      slug: slugFinal,
      status: 'active',
      ativo: true,
      owner_user_id: null,
    })
    .select('id, slug')
    .single()

  if (error) throw new Error(error.message)

  if (input.culinariaIds.length > 0) {
    const { error: erroCulinaria } = await supabase.from('estabelecimento_tipos_cozinha').insert(
      input.culinariaIds.map((id) => ({ estabelecimento_id: novoEstabelecimento.id, tipo_cozinha_id: id }))
    )
    if (erroCulinaria) {
      throw new Error(`Estabelecimento criado, mas houve erro ao salvar culinária: ${erroCulinaria.message}`)
    }
  }

  const horariosValidos = input.horarios.filter((h) => !h.fechado)
  if (horariosValidos.length > 0) {
    const { error: erroHorarios } = await supabase.from('horarios_funcionamento').insert(
      horariosValidos.map((h) => ({
        estabelecimento_id: novoEstabelecimento.id,
        dia_semana: h.diaSemana,
        horario_abertura: h.horarioAbertura,
        horario_fechamento: h.horarioFechamento,
        fechado: false,
      }))
    )
    if (erroHorarios) {
      throw new Error(`Estabelecimento criado, mas houve erro ao salvar horários: ${erroHorarios.message}`)
    }
  }

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'estabelecimento_importado_em_lote',
    target_type: 'estabelecimentos',
    target_id: novoEstabelecimento.id,
    new_data: { nome_fantasia: input.nomeFantasia, cnpj: cnpjLimpo },
  })

  return { id: novoEstabelecimento.id, slug: novoEstabelecimento.slug }
}
