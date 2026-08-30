'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { UserPlus2 } from 'lucide-react'
import { responderConversaManualmente, marcarConversaResolvida } from '@/modules/whatsapp/atendimentoActions'
import { formatarTelefoneExibicao } from '@/lib/telefone'
import { haQuantoTempo } from '../tempoEspera'
import type { ConversaFilaIA, MensagemConversa } from '../types'

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarDiaSeparador(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function mesmoDia(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/** Painel de detalhe pra um item de conversa (WhatsApp) selecionado na
 *  Central do Operador — cobre tanto "IA precisa de você" (precisa_humano
 *  = true) quanto uma conversa já resolvida (histórico). Vocabulário de
 *  ação único: só existe "Marcar como resolvido" — "Devolver pra IA" era
 *  o mesmo botão com outro nome em ConversasInbox.tsx, e "Assumir
 *  conversa" não tinha efeito nenhum no backend; "Atribuir a mim" abaixo
 *  é uma sinalização real de posse (client-side por enquanto — ver nota
 *  no componente pai sobre persistir isso). Montado com key={conversa.id}
 *  pelo pai, pra que o rascunho de resposta reinicie sozinho ao trocar de
 *  conversa. */
export default function PainelConversa({
  estabelecimentoId,
  conversa,
  atribuidoPara,
  aoAtribuirAMim,
}: {
  estabelecimentoId: string
  conversa: ConversaFilaIA
  /** Nome de quem já assumiu essa conversa nesta sessão do navegador, ou
   *  null se ninguém assumiu ainda. Ver nota em CentralOperador.tsx —
   *  ainda não persiste no banco. */
  atribuidoPara: string | null
  aoAtribuirAMim: () => void
}) {
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resolvendo, setResolvendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const transcricaoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = transcricaoRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [conversa.mensagens.length])

  const gruposTranscricao = useMemo(() => {
    const grupos: { data: string; mensagens: MensagemConversa[] }[] = []
    for (const m of conversa.mensagens) {
      const ultimoGrupo = grupos[grupos.length - 1]
      if (ultimoGrupo && mesmoDia(ultimoGrupo.mensagens[0].timestamp, m.timestamp)) {
        ultimoGrupo.mensagens.push(m)
      } else {
        grupos.push({ data: m.timestamp, mensagens: [m] })
      }
    }
    return grupos
  }, [conversa.mensagens])

  async function enviar() {
    if (!resposta.trim() || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await responderConversaManualmente(estabelecimentoId, conversa.id, resposta.trim())
      setResposta('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar.')
    }
    setEnviando(false)
  }

  async function resolver() {
    setResolvendo(true)
    setErro(null)
    try {
      await marcarConversaResolvida(estabelecimentoId, conversa.id)
      // Sem setResolvendo(false) no sucesso: o item some/reclassifica na
      // lista via Realtime assim que precisa_humano vira false.
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao marcar como resolvido.')
      setResolvendo(false)
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 pb-4 pt-6">
        <div className="min-w-0">
          <p className="truncate text-[22px] font-bold leading-tight text-neutral-900">
            {formatarTelefoneExibicao(conversa.telefone)}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-600">
            WhatsApp
            {conversa.precisa_humano
              ? ` · esperando há ${haQuantoTempo(conversa.ultima_interacao_em)}`
              : ` · última interação há ${haQuantoTempo(conversa.ultima_interacao_em)} · resolvida`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {conversa.precisa_humano && (
            <button
              onClick={aoAtribuirAMim}
              disabled={!!atribuidoPara}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition disabled:cursor-default ${
                atribuidoPara ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <UserPlus2 className="h-3.5 w-3.5" />
              {atribuidoPara ? `Com ${atribuidoPara}` : 'Atribuir a mim'}
            </button>
          )}
          {conversa.precisa_humano && (
            <button
              onClick={resolver}
              disabled={resolvendo}
              className="shrink-0 whitespace-nowrap rounded-full bg-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-300 disabled:opacity-50"
            >
              Marcar como resolvido
            </button>
          )}
        </div>
      </div>

      <div ref={transcricaoRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {gruposTranscricao.map((grupo) => (
          <div key={grupo.data} className="flex flex-col gap-3">
            <div className="self-center whitespace-nowrap rounded-full bg-neutral-100 px-3 py-1 text-[10.5px] font-semibold text-neutral-600">
              {formatarDiaSeparador(grupo.data)}
            </div>
            {grupo.mensagens.map((m, i) => (
              <div
                key={i}
                className={`flex max-w-[64%] flex-col gap-1 ${m.role === 'user' ? 'self-start items-start' : 'self-end items-end'}`}
              >
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-neutral-100 text-neutral-900' : 'bg-sky-100 text-sky-900'
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] font-bold tracking-wide text-neutral-500">{formatarHora(m.timestamp)}</span>
              </div>
            ))}
          </div>
        ))}
        {conversa.precisa_humano && (
          <div className="flex items-center justify-center gap-2 self-center whitespace-nowrap rounded-full bg-amber-100 px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            <span className="text-[10.5px] font-bold tracking-wide text-amber-800">
              A IA NÃO SOUBE RESPONDER — PASSOU PRA VOCÊ
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-neutral-100 px-6 pb-6 pt-4">
        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <div className="flex items-center gap-2">
          <input
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
            placeholder={conversa.precisa_humano ? 'Escreva pro cliente…' : 'Reabrir com uma nova mensagem…'}
            disabled={enviando}
            className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          />
          <button
            onClick={enviar}
            disabled={enviando || !resposta.trim()}
            className="shrink-0 whitespace-nowrap rounded-full bg-orange-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            {enviando ? 'Enviando…' : 'Responder'}
          </button>
        </div>
      </div>
    </>
  )
}
