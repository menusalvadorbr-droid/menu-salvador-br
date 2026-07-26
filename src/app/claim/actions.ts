'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

interface EnviarClaimInput {
  estabelecimentoId: string
}

export async function enviarClaim(input: EnviarClaimInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // O perfil já é garantido completo antes de chegar aqui (checarPerfilCompleto,
  // rodado em /estabelecimentos/novo) — busca os dados de lá em vez de
  // pedir de novo nesse formulário.
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, cpf, telefone, whatsapp')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.cpf) {
    throw new Error('Complete seu perfil (CPF e contato) antes de reivindicar.')
  }

  const nomeResponsavel = profile.nome || user.user_metadata?.full_name || ''
  const cpfResponsavel = profile.cpf
  const telefoneContato = profile.telefone || ''
  const whatsappContato = profile.whatsapp || ''

  // ── Garante que o estabelecimento existe e ainda não tem dono ──
  // (checagem no servidor — nunca confiar só na tela que já escondia o
  // botão de reivindicar para estabelecimentos já vinculados)
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, owner_user_id')
    .eq('id', input.estabelecimentoId)
    .maybeSingle()

  if (!est) throw new Error('Estabelecimento não encontrado.')
  if (est.owner_user_id) {
    throw new Error('Este estabelecimento já foi reivindicado por outra pessoa.')
  }

  // ── Impede reivindicação duplicada em aberto ───────────────
  const { data: claimExistente } = await supabase
    .from('restaurant_claims')
    .select('id, status')
    .eq('estabelecimento_id', input.estabelecimentoId)
    .eq('usuario_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (claimExistente) {
    // Já existe uma solicitação em aberto — apenas segue pro onboarding,
    // não cria uma segunda linha em restaurant_claims.
    redirect(`/painel/estabelecimento/${input.estabelecimentoId}/onboarding`)
  }

  // ── Cria a solicitação ──────────────────────────────────────
  const { error: claimError } = await supabase.from('restaurant_claims').insert({
    estabelecimento_id: input.estabelecimentoId,
    usuario_id: user.id,
    status: 'pending',
    nome_responsavel: nomeResponsavel,
    cpf_responsavel: cpfResponsavel,
    telefone_contato: telefoneContato || null,
    whatsapp_contato: whatsappContato || null,
  })

  if (claimError) throw new Error(claimError.message)

  // ── Vincula o usuário como dono provisório e oculta a página ──
  // Usa o client com service role (bypassa RLS) de propósito: a policy
  // de dono (`estabelecimentos_manage_owner`) exige `auth.uid() =
  // owner_user_id`, que ainda não é verdade nesse momento (é exatamente
  // isso que essa escrita está prestes a criar). Fazer isso com uma
  // policy de RLS permissiva pra "qualquer autenticado pode se auto
  // atribuir dono de um estabelecimento sem dono" seria perigoso — deixaria
  // qualquer pessoa "roubar" um estabelecimento sem passar por aqui,
  // direto pelo client. Toda a validação que importa (usuário
  // autenticado, estabelecimento sem dono, dados obrigatórios) já
  // aconteceu acima, então usar o service role aqui é seguro.
  const { data: estAtualizado, error: estError } = await supabaseAdmin
    .from('estabelecimentos')
    .update({
      owner_user_id: user.id,
      status: 'em_analise',
      ativo: false,
    })
    .eq('id', input.estabelecimentoId)
    .is('owner_user_id', null) // dupla checagem contra corrida entre duas reivindicações simultâneas
    .select('id')
    .single()

  if (estError || !estAtualizado) {
    throw new Error(
      'Não foi possível vincular o estabelecimento — é possível que alguém tenha reivindicado no mesmo instante. Tente novamente.'
    )
  }

  await supabaseAdmin.from('audit_logs').insert({
    usuario_id: user.id,
    action: 'claim_submetida',
    target_type: 'estabelecimentos',
    target_id: input.estabelecimentoId,
    new_data: { status: 'em_analise', nome_responsavel: nomeResponsavel },
  })

  redirect(`/painel/estabelecimento/${input.estabelecimentoId}/onboarding`)
}

/**
 * Quando o CNPJ já pertence a outro dono e a pessoa acha que isso está
 * errado. Diferente de enviarClaim (que só existe pra estabelecimento
 * sem dono), isso não vincula ninguém automaticamente — só abre uma
 * contestação numa fila separada pro admin decidir manualmente.
 */
export async function enviarContestacao(estabelecimentoId: string, justificativa: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const justificativaLimpa = justificativa.trim()
  if (justificativaLimpa.length < 10) {
    throw new Error('Descreva com um pouco mais de detalhe (pelo menos 10 caracteres).')
  }

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, owner_user_id')
    .eq('id', estabelecimentoId)
    .maybeSingle()

  if (!est) throw new Error('Estabelecimento não encontrado.')
  if (!est.owner_user_id) throw new Error('Esse estabelecimento não tem dono — use reivindicar em vez de contestar.')
  if (est.owner_user_id === user.id) throw new Error('Esse estabelecimento já é seu.')

  const { error } = await supabase.from('vinculo_contestacoes').insert({
    estabelecimento_id: estabelecimentoId,
    usuario_id: user.id,
    justificativa: justificativaLimpa,
  })
  if (error) throw new Error(error.message)

  await supabaseAdmin.from('audit_logs').insert({
    usuario_id: user.id,
    action: 'contestacao_enviada',
    target_type: 'estabelecimentos',
    target_id: estabelecimentoId,
  })
}
