'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { validarCpf } from '@/lib/cpf'
import { calcularIdade } from '@/lib/idade'

// ============================================================
// SERVER ACTION: LOGOUT
// ============================================================
export async function handleLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// SERVER ACTION: ATUALIZAR PERFIL
// ============================================================
export async function atualizarPerfil(dados: {
  nome: string
  cpf: string
  telefone: string
  whatsapp: string
  dataNascimento: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const nomeLimpo = dados.nome.trim()
  if (!nomeLimpo) throw new Error('Informe seu nome.')

  const cpfLimpo = dados.cpf.replace(/\D/g, '')
  if (cpfLimpo.length > 0 && !validarCpf(cpfLimpo)) {
    throw new Error('CPF inválido.')
  }

  if (dados.dataNascimento) {
    const idade = calcularIdade(dados.dataNascimento)
    if (idade === null || idade < 18) {
      throw new Error('É preciso ter 18 anos ou mais.')
    }
  }

  // full_name em auth.users é o que aparece em toda a interface hoje
  // (ex: a saudação da tela de boas-vindas); profiles.nome é o que o
  // admin usa pra listar (ex: /admin/logs). Mantém os dois em sincronia
  // pra não ter dois nomes divergentes pra mesma pessoa.
  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: nomeLimpo } })
  if (authError) throw new Error(authError.message)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      nome: nomeLimpo,
      cpf: cpfLimpo || null,
      telefone: dados.telefone.trim() || null,
      whatsapp: dados.whatsapp.trim() || null,
      data_nascimento: dados.dataNascimento || null,
    })
    .eq('id', user.id)
  if (profileError) throw new Error(profileError.message)
}
export async function toggleOcultar(formData: FormData) {
  const id = formData.get('id') as string
  const ativo = formData.get('ativo') === 'true'
  const supabase = await createClient()
  await supabase
    .from('estabelecimentos')
    .update({ ativo: !ativo })
    .eq('id', id)
  redirect('/painel')
}

// ============================================================
// SERVER ACTION: EXCLUIR (soft delete)
// ============================================================
export async function excluirEstabelecimento(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase
    .from('estabelecimentos')
    .update({ status: 'inactive', ativo: false })
    .eq('id', id)
  redirect('/painel')
}

// ============================================================
// SERVER ACTION: TROCAR SENHA
// ============================================================
export async function trocarSenha(senhaAtual: string, novaSenha: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) throw new Error('Não autenticado')

  if (novaSenha.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.')
  }

  // Confirma a senha atual de verdade, reautenticando com ela, antes de
  // trocar — sem isso, qualquer sessão aberta poderia trocar a senha
  // sem provar que sabe a atual.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  })
  if (reauthError) throw new Error('Senha atual incorreta.')

  const { error } = await supabase.auth.updateUser({ password: novaSenha })
  if (error) throw new Error(error.message)
}

// ============================================================
// SERVER ACTION: EXCLUIR MINHA CONTA (LGPD)
// ============================================================
export async function excluirMinhaConta(confirmacaoEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  if (confirmacaoEmail.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
    throw new Error('O e-mail digitado não confere com o da sua conta.')
  }

  // Estabelecimentos que essa pessoa administra sozinha voltam a ficar
  // públicos, sem dono — disponíveis pra alguém reivindicar de novo,
  // em vez de sumir do diretório junto com a conta.
  const { error: liberarError } = await supabaseAdmin
    .from('estabelecimentos')
    .update({ owner_user_id: null, status: 'active', ativo: true })
    .eq('owner_user_id', user.id)
  if (liberarError) throw new Error(liberarError.message)

  await supabaseAdmin.from('profiles').delete().eq('id', user.id)

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) throw new Error(deleteError.message)

  await supabase.auth.signOut()
  redirect('/')
}
