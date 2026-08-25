import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { validarAssinaturaWebhook } from '@/lib/whatsapp/metaApi'
import { processarMensagemWhatsApp } from '@/lib/aiWaiter/whatsappHandler'

export const runtime = 'nodejs'
// after() roda dentro do orçamento de tempo da própria função (na Vercel,
// por baixo dos panos é implementado com o waitUntil() deles mesmo — não
// precisa trocar de API, só garantir orçamento suficiente). Sem isto, cai
// no padrão da plataforma (10s no Hobby), curto pra IA + Meta + Supabase
// em sequência no processamento assíncrono depois do 200.
export const maxDuration = 30

// Formato padrão da Cloud API (webhook de mensagens) — só o que usamos
// nesta fase (texto simples); outros tipos (imagem, áudio, botão) e
// notificações de status (entregue/lido) são ignorados de propósito, sem
// erro, só sem ação.
interface WebhookPayload {
  entry?: {
    changes?: {
      value?: {
        metadata?: { phone_number_id?: string }
        messages?: {
          id?: string
          from?: string
          type?: string
          text?: { body?: string }
        }[]
      }
    }[]
  }[]
}

/** Handshake de verificação — a Meta chama isso uma vez ao configurar o
 *  webhook no Business Manager, pra confirmar que a URL é nossa mesmo. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const modo = searchParams.get('hub.mode')
  const tokenRecebido = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (modo === 'subscribe' && tokenRecebido === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Verificação falhou.', { status: 403 })
}

/** Notificação de mensagem recebida. Regra crítica: valida e responde 200
 *  imediatamente, processa depois — a Meta reenvia a notificação se não
 *  receber 200 rápido, e reprocessar duplicaria a chamada de IA (custo em
 *  dobro + resposta repetida pro cliente). O processamento roda via
 *  after() do Next.js (equivalente ao waitUntil da Vercel embutido no
 *  framework) depois que a resposta já foi enviada, sem segurar a Meta
 *  esperando a IA responder. */
export async function POST(request: NextRequest) {
  const payloadCru = await request.text()

  const assinaturaValida = validarAssinaturaWebhook(payloadCru, request.headers.get('x-hub-signature-256'))
  if (!assinaturaValida) {
    return new Response('Assinatura inválida.', { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = JSON.parse(payloadCru)
  } catch {
    return new Response('JSON inválido.', { status: 400 })
  }

  const value = payload.entry?.[0]?.changes?.[0]?.value
  const mensagem = value?.messages?.[0]
  const phoneNumberId = value?.metadata?.phone_number_id

  // Sem mensagem de texto (ex: notificação de status "entregue"/"lido",
  // ou tipo de mídia fora do escopo desta fase) — confirma recebimento,
  // sem processar nada.
  if (!mensagem || mensagem.type !== 'text' || !mensagem.text?.body || !mensagem.from || !mensagem.id || !phoneNumberId) {
    return NextResponse.json({ status: 'ignorado' }, { status: 200 })
  }

  after(() =>
    processarMensagemWhatsApp({
      phoneNumberId,
      telefone: mensagem.from!,
      texto: mensagem.text!.body!,
      wamid: mensagem.id!,
    }).catch((err) => {
      console.error('[whatsapp webhook] erro no processamento assíncrono:', err)
    })
  )

  return NextResponse.json({ status: 'recebido' }, { status: 200 })
}
