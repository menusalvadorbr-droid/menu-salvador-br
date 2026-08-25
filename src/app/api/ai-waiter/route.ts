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

  const system = montarSystemPrompt(contexto)

  // Breakpoint 1 — system (prompt fixo + cardápio via RAG): idêntico durante
  // toda a sessão do estabelecimento, então cacheável turno a turno. Abaixo
  // de ~4.096 tokens (mínimo cacheável do Haiku 4.5) o cache_control é
  // ignorado silenciosamente (cache_creation_input_tokens: 0) — sem erro,
  // só sem economia; ver log de uso abaixo pra conferir.
  //
  // Breakpoint 2 — última mensagem do histórico ANTERIOR à pergunta atual:
  // repete integralmente do turno N pro N+1, então cacheável; a pergunta
  // nova entra depois, sem cache_control (varia a cada request).
  const historico = mensagens.slice(0, -1)
  const perguntaAtual = mensagens[mensagens.length - 1]
  const messagesParam: Anthropic.MessageParam[] = [
    ...historico.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    ...(historico.length > 0
      ? [
          {
            role: historico[historico.length - 1].role,
            content: [
              {
                type: 'text' as const,
                text: historico[historico.length - 1].content,
                cache_control: { type: 'ephemeral' as const },
              },
            ],
          },
        ]
      : []),
    { role: perguntaAtual.role, content: perguntaAtual.content },
  ]

  // Haiku 4.5: pergunta simples sobre dado já fornecido no prompt de sistema,
  // sem raciocínio complexo — não justifica o custo de um modelo Opus.
  const stream = client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: messagesParam,
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
        console.log('[ai-waiter] cache usage', {
          slug,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          cache_creation_input_tokens: final.usage.cache_creation_input_tokens,
          cache_read_input_tokens: final.usage.cache_read_input_tokens,
        })
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
