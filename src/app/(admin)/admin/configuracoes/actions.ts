'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'

export async function salvarSecoes(secoes: Array<{ chave: string; label: string; ativa: boolean; ordem: number }>) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key: 'secoes_estabelecimento',
      value: secoes,
      description: 'Seções exibidas na página pública do estabelecimento',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'secoes_estabelecimento_atualizadas',
    target_type: 'platform_settings',
    new_data: { secoes },
  })

  revalidatePath('/admin/configuracoes')
}

export async function salvarPaleta(corPrimaria: string, corSecundaria: string) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key: 'paleta_plataforma',
      value: { cor_primaria: corPrimaria, cor_secundaria: corSecundaria },
      description: 'Cores de marca usadas fora do cardápio de cada estabelecimento',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'paleta_plataforma_atualizada',
    target_type: 'platform_settings',
    new_data: { cor_primaria: corPrimaria, cor_secundaria: corSecundaria },
  })

  revalidatePath('/admin/configuracoes')
}

/**
 * Liga/desliga a tela de conexão automática do WhatsApp (Embedded Signup
 * da Meta) em todos os estabelecimentos — ver plano "Menu Salvador como
 * Tech Provider". A tela em si (ConexaoAutomaticaWhatsApp.tsx) já é
 * completa e pronta desde já; esta flag só controla se ela aparece,
 * porque a integração real com a Meta depende de aprovação (App Review)
 * que ainda não aconteceu. Nada fixo — vira só isto quando estiver pronta.
 */
export async function salvarWhatsappEmbeddedSignupAtivado(ativado: boolean) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key: 'whatsapp_embedded_signup_ativado',
      value: { ativado },
      description: 'Mostra a conexão automática de WhatsApp (Embedded Signup) no painel do estabelecimento',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'whatsapp_embedded_signup_ativado_atualizado',
    target_type: 'platform_settings',
    new_data: { ativado },
  })

  revalidatePath('/admin/configuracoes')
}

export async function salvarConfiguracoesHome(config: {
  hero_ativado: boolean
  busca_ativado: boolean
  promocoes_ativado: boolean
  explorar_bairro_ativado: boolean
  categorias_populares_ativado: boolean
  recomendados_ativado: boolean
  grid_estabelecimentos_ativado: boolean
  filtros_ativado: boolean
  cta_donos_ativado: boolean
  botao_flutuante_ativado: boolean
}) {
  const { supabase, userId } = await checarSuperAdmin()
  const { error } = await supabase
    .from('configuracoes_home')
    .upsert({ id: true, ...config }, { onConflict: 'id' })
  if (error) throw new Error(error.message)

  await supabase.from('audit_logs').insert({
    usuario_id: userId,
    action: 'configuracoes_home_atualizadas',
    target_type: 'configuracoes_home',
    new_data: config,
  })

  // A home é a própria raiz do site — precisa revalidar "/", não
  // "/admin/configuracoes", senão a mudança só aparece pro visitante
  // depois que o cache expirar sozinho.
  revalidatePath('/')
}
