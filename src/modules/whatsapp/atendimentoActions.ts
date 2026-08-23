'use server'

import { createClient } from '@/lib/supabase/server'
import { enviarMensagemWhatsApp } from '@/lib/whatsapp/metaApi'

/** Resposta manual pelo painel — usada quando o robô está desligado, ou
 *  quando a conversa foi marcada como "precisa humano" (o cliente pediu
 *  atendente, ou a IA falhou). RLS de whatsapp_conversas/estabelecimentos
 *  (dono/gerente/funcionário) já protege quem pode chamar isto — client de
 *  sessão, não a service role. */
export async function responderConversaManualmente(
  estabelecimentoId: string,
  conversaId: string,
  texto: string
): Promise<void> {
  const supabase = await createClient()

  const { data: est, error: estErro } = await supabase
    .from('estabelecimentos')
    .select('whatsapp_phone_number_id, whatsapp_access_token')
    .eq('id', estabelecimentoId)
    .single()
  if (estErro || !est?.whatsapp_phone_number_id || !est?.whatsapp_access_token) {
    throw new Error('WhatsApp não está conectado pra este estabelecimento.')
  }

  const { data: conversa, error: conversaErro } = await supabase
    .from('whatsapp_conversas')
    .select('telefone, mensagens')
    .eq('id', conversaId)
    .eq('estabelecimento_id', estabelecimentoId)
    .single()
  if (conversaErro || !conversa) throw new Error('Conversa não encontrada.')

  await enviarMensagemWhatsApp(est.whatsapp_phone_number_id, est.whatsapp_access_token, conversa.telefone, texto)

  const mensagens = [...(conversa.mensagens || []), { role: 'assistant', content: texto, timestamp: new Date().toISOString() }]
  const { error: updErro } = await supabase
    .from('whatsapp_conversas')
    .update({ mensagens, ultima_interacao_em: new Date().toISOString() })
    .eq('id', conversaId)
  if (updErro) throw new Error(updErro.message)
}

/** Marca a conversa como resolvida — some do destaque de "esperando
 *  atendimento" até (se for o caso) o robô ou um humano marcarem de novo. */
export async function marcarConversaResolvida(estabelecimentoId: string, conversaId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('whatsapp_conversas')
    .update({ precisa_humano: false })
    .eq('id', conversaId)
    .eq('estabelecimento_id', estabelecimentoId)
  if (error) throw new Error(error.message)
}
