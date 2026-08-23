'use server'

import { createClient } from '@/lib/supabase/server'
import { verificarConexaoWhatsApp } from '@/lib/whatsapp/metaApi'

/** Salva phone_number_id + access token (colados pelo dono a partir do
 *  Business Manager da Meta — opção mais simples de conectar, "Embedded
 *  Signup" fica pra quando o produto for pra mais de um estabelecimento
 *  real) e confirma na hora que autenticam de verdade contra a Cloud API,
 *  em vez de só aceitar o que foi colado sem checar. RLS de
 *  `estabelecimentos` (dono/gerente) já protege quem pode chamar isto —
 *  client Supabase de sessão, não a service role. */
export async function salvarEVerificarConexaoWhatsApp(
  estabelecimentoId: string,
  phoneNumberId: string,
  accessToken: string
): Promise<{ conectado: boolean }> {
  const conectado = await verificarConexaoWhatsApp(phoneNumberId, accessToken)

  const supabase = await createClient()
  const { error } = await supabase
    .from('estabelecimentos')
    .update({
      whatsapp_phone_number_id: phoneNumberId,
      whatsapp_access_token: accessToken,
      whatsapp_status: conectado ? 'conectado' : 'erro',
    })
    .eq('id', estabelecimentoId)
  if (error) throw new Error(error.message)

  // O webhook resolve o estabelecimento pelo phone_number_id recebido da
  // Meta, então essa tabela precisa ficar em sincronia com o que acabou de
  // ser salvo acima — sem isto, salvar a conexão aqui não bastava pra fazer
  // uma mensagem de entrada ser roteada pro estabelecimento certo.
  if (conectado) {
    const { error: erroMapa } = await supabase
      .from('whatsapp_numero_estabelecimento')
      .upsert({ phone_number_id: phoneNumberId, estabelecimento_id: estabelecimentoId }, { onConflict: 'phone_number_id' })
    if (erroMapa) throw new Error(erroMapa.message)
  }

  return { conectado }
}
