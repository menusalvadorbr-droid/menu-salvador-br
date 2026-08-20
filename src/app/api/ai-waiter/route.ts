import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { buildCardapioContext } from '@/lib/aiWaiter/buildCardapioContext'
import { montarSystemPrompt } from '@/lib/aiWaiter/systemPrompt'

export const runtime = 'nodejs'

// Client lido de ANTHROPIC_API_KEY no ambiente do servidor — nunca chega ao
// navegador do cliente (rota só roda server-side).
const client = new Anthropic()

interface MensagemEntrada {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  let body: { slug?: string; mensagens?: MensagemEntrada[] }
  try {
    body = await request.json()
  } catch {
    return new Response('JSON inválido.', { status: 400 })
  }

  const { slug, mensagens } = body
  if (!slug || !Array.isArray(mensagens) || mensagens.length === 0) {
    return new Response('Requisição inválida: informe slug e mensagens.', { status: 400 })
  }
  const ultimaMensagem = mensagens[mensagens.length - 1]
  if (ultimaMensagem.role !== 'user' || !ultimaMensagem.content.trim()) {
    return new Response('A última mensagem precisa ser do cliente.', { status: 400 })
  }

  const contexto = await buildCardapioContext(slug)
  if (!contexto) {
    return new Response('Estabelecimento não encontrado.', { status: 404 })
  }

  const system = montarSystemPrompt(contexto.nome, contexto.itens)

  // Haiku 4.5: pergunta simples sobre dado já fornecido no prompt de sistema,
  // sem raciocínio complexo — não justifica o custo de um modelo Opus.
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system,
    messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\n\nNão consegui responder essa pergunta. Pode reformular?'))
        }
      } catch {
        controller.enqueue(encoder.encode('\n\nOcorreu um erro ao gerar a resposta. Tente novamente.'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
