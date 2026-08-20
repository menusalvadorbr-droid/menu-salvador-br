import { NextRequest } from 'next/server'
import { buildCardapioContext } from '@/lib/aiWaiter/buildCardapioContext'
import { montarSystemPrompt } from '@/lib/aiWaiter/systemPrompt'

export const runtime = 'nodejs'

// API do DeepSeek segue o formato OpenAI (/chat/completions), não o formato
// Anthropic (/v1/messages) — por isso é fetch cru aqui, sem o SDK da
// Anthropic usado em /api/ai-waiter. deepseek-v4-flash é o modelo rápido/
// econômico atual (confirmado na doc oficial em 2026-08; "deepseek-chat" foi
// descontinuado como nome de modelo).
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'

interface MensagemEntrada {
  role: 'user' | 'assistant'
  content: string
}

interface DeepSeekStreamChunk {
  choices?: { delta?: { content?: string } }[]
}

// Mesmo contrato de entrada/saída de /api/ai-waiter (body {slug, mensagens},
// resposta em texto puro via stream) — de propósito, pra dar pra comparar
// lado a lado só trocando a URL chamada pelo cliente de teste.
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

  // Chave lida só no servidor (DEEPSEEK_API_KEY) — nunca chega ao navegador,
  // mesma garantia do endpoint Haiku.
  const deepseekResp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: system },
        ...mensagens.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: 1024,
    }),
  })

  if (!deepseekResp.ok || !deepseekResp.body) {
    return new Response('Erro ao chamar a API do DeepSeek.', { status: 502 })
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = deepseekResp.body.getReader()

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = ''
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let indiceQuebra: number
          while ((indiceQuebra = buffer.indexOf('\n')) !== -1) {
            const linha = buffer.slice(0, indiceQuebra).trim()
            buffer = buffer.slice(indiceQuebra + 1)
            if (!linha.startsWith('data:')) continue
            const dados = linha.slice(5).trim()
            if (dados === '[DONE]') continue
            try {
              const chunk = JSON.parse(dados) as DeepSeekStreamChunk
              const texto = chunk.choices?.[0]?.delta?.content
              if (texto) controller.enqueue(encoder.encode(texto))
            } catch {
              // Linha SSE incompleta ou de outro tipo (ex: comentário
              // keep-alive) — ignora sem interromper o stream.
            }
          }
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
