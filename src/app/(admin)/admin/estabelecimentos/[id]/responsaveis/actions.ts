'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const CARGOS_VALIDOS = ['gerente', 'caixa', 'garcom', 'cozinha', 'contador']

export async function alterarCargoFuncionarioAdmin(funcionarioId: string, estabelecimentoId: string, novoCargo: string) {
  const { userId } = await checarSuperAdmin()

  if (!CARGOS_VALIDOS.includes(novoCargo)) throw new Error('Cargo inválido.')

  // Usa o client de service role: a tabela `funcionarios` foi desenhada
  // pro dono/gerente do próprio estabelecimento gerenciar sua equipe, e
  // não confirmamos uma policy de RLS que libere super_admin nela — pra
  // não repetir o mesmo tipo de bug silencioso que já resolvemos antes em
  // "estabelecimentos" (RLS bloqueando sem erro nenhum), escrevemos aqui
  // direto com o service role já com a checagem de super_admin acima.
  const { error } = await supabaseAdmin
    .from('funcionarios')
    .update({ cargo: novoCargo })
    .eq('id', funcionarioId)

  if (error) throw new Error(error.message)

  await supabaseAdmin.from('audit_logs').insert({
    usuario_id: userId,
    action: 'funcionario_cargo_alterado_pelo_admin',
    target_type: 'funcionarios',
    target_id: funcionarioId,
    new_data: { cargo: novoCargo },
  })

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/analisar`)
}

export async function desativarFuncionarioAdmin(funcionarioId: string, estabelecimentoId: string) {
  const { userId } = await checarSuperAdmin()

  const { error } = await supabaseAdmin
    .from('funcionarios')
    .update({ ativo: false })
    .eq('id', funcionarioId)

  if (error) throw new Error(error.message)

  await supabaseAdmin.from('audit_logs').insert({
    usuario_id: userId,
    action: 'funcionario_desativado_pelo_admin',
    target_type: 'funcionarios',
    target_id: funcionarioId,
  })

  revalidatePath(`/admin/estabelecimentos/${estabelecimentoId}/analisar`)
}
