'use client'

import { useEffect, useRef, useState } from 'react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
}

interface PainelConfig {
  endpoint: string
  label: string
  sublabel: string
}

// Um painel por endpoint de teste — cada um mantém sua própria conversa
// (histórico independente), pra comparar velocidade e qualidade lado a
// lado sem trocar de aba. Adicionar um 3º modelo de teste é só adicionar
// uma entrada aqui.
const PAINEIS: PainelConfig[] = [
  { endpoint: '/api/ai-waiter', label: 'Claude Haiku 4.5', sublabel: 'Anthropic' },
  { endpoint: '/api/ai-waiter-deepseek', label: 'DeepSeek V4 Flash', sublabel: 'DeepSeek' },
]

const SUGESTOES = [
  'Tem opção sem glúten?',
  'Qual você recomenda?',
  'Tem alguma promoção hoje?',
  'Quais são os pratos mais baratos?',
]

interface Props {
  slug: string
  nomeEstabelecimento: string
}

export default function AiWaiterChat({ slug, nomeEstabelecimento }: Props) {
  const [mensagensPorPainel, setMensagensPorPainel] = useState<Record<string, Mensagem[]>>(() =>
    Object.fromEntries(PAINEIS.map((p) => [p.endpoint, []]))
  )
  const [enviandoPorPainel, setEnviandoPorPainel] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PAINEIS.map((p) => [p.endpoint, false]))
  )
  const [texto, setTexto] = useState('')
  const algumPainelEnviando = PAINEIS.some((p) => enviandoPorPainel[p.endpoint])

  async function enviarParaPainel(painel: PainelConfig, pergunta: string) {
    const historicoAnterior = mensagensPorPainel[painel.endpoint] || []
    const historico: Mensagem[] = [...historicoAnterior, { role: 'user', content: pergunta }]

    setMensagensPorPainel((prev) => ({ ...prev, [painel.endpoint]: [...historico, { role: 'assistant', content: '' }] }))
    setEnviandoPorPainel((prev) => ({ ...prev, [painel.endpoint]: true }))

    try {
      const resp = await fetch(painel.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, mensagens: historico }),
      })
      if (!resp.ok || !resp.body) throw new Error('Falha na resposta')

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let acumulado = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acumulado += decoder.decode(value, { stream: true })
        const textoAtual = acumulado
        setMensagensPorPainel((prev) => {
          const copia = [...(prev[painel.endpoint] || [])]
          copia[copia.length - 1] = { role: 'assistant', content: textoAtual }
          return { ...prev, [painel.endpoint]: copia }
        })
      }
    } catch {
      setMensagensPorPainel((prev) => {
        const copia = [...(prev[painel.endpoint] || [])]
        copia[copia.length - 1] = { role: 'assistant', content: 'Erro ao buscar resposta. Tente novamente.' }
        return { ...prev, [painel.endpoint]: copia }
      })
    } finally {
      setEnviandoPorPainel((prev) => ({ ...prev, [painel.endpoint]: false }))
    }
  }

  function enviarParaTodos(pergunta: string) {
    const perguntaLimpa = pergunta.trim()
    if (!perguntaLimpa || algumPainelEnviando) return
    setTexto('')
    // Dispara os dois em paralelo — sem await entre eles, senão o segundo
    // só começaria depois do primeiro terminar de streamar.
    for (const painel of PAINEIS) {
      enviarParaPainel(painel, perguntaLimpa)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-900 p-4 text-white">
        <p className="font-semibold">Atendente virtual — {nomeEstabelecimento}</p>
        <p className="text-xs text-neutral-300">
          Teste interno · comparação lado a lado · respostas restritas ao cardápio cadastrado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PAINEIS.map((painel) => (
          <PainelChat
            key={painel.endpoint}
            label={painel.label}
            sublabel={painel.sublabel}
            mensagens={mensagensPorPainel[painel.endpoint] || []}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => enviarParaTodos(s)}
            disabled={algumPainelEnviando}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviarParaTodos(texto)
        }}
        className="flex gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite sua pergunta — vai pros dois ao mesmo tempo..."
          disabled={algumPainelEnviando}
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={algumPainelEnviando || !texto.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}

interface PainelChatProps {
  label: string
  sublabel: string
  mensagens: Mensagem[]
}

function PainelChat({ label, sublabel, mensagens }: PainelChatProps) {
  const listaRef = useRef<HTMLDivElement>(null)

  // Cada painel rola independente do outro — a resposta de um modelo mais
  // lento não deve arrastar a tela de quem já terminou de ler o outro.
  useEffect(() => {
    const lista = listaRef.current
    if (lista) lista.scrollTop = lista.scrollHeight
  }, [mensagens])

  return (
    <div className="flex h-[65vh] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 bg-neutral-800 p-3 text-white">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-neutral-300">{sublabel}</p>
      </div>

      <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.length === 0 && (
          <p className="mt-8 text-center text-sm text-neutral-400">Aguardando pergunta...</p>
        )}
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-orange-500 text-white'
                : 'mr-auto bg-neutral-100 text-neutral-800'
            }`}
          >
            {m.content || (m.role === 'assistant' ? '…' : '')}
          </div>
        ))}
      </div>
    </div>
  )
}
