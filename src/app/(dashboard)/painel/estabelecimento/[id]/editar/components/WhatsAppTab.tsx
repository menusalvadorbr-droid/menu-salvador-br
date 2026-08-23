'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { salvarEVerificarConexaoWhatsApp } from './whatsappActions'
import AiWaiterChat from '@/app/(public-cardapio)/cardapio/[slug]/teste-ai/AiWaiterChat'

interface Atalho {
  gatilho: string
  resposta: string
}

interface WhatsAppTabProps {
  estabelecimento: {
    id: string
    slug?: string
    nome?: string
    nome_fantasia?: string | null
    whatsapp_robo_ativado?: boolean
    whatsapp_status?: 'nao_conectado' | 'conectado' | 'erro'
    whatsapp_phone_number_id?: string | null
    whatsapp_atalhos?: Atalho[] | null
  }
  readOnly?: boolean
}

interface Metricas {
  atalho: number
  ia: number
  custoEstimadoUsd: number
}

// Preço aproximado do DeepSeek V4 Flash — só dá ordem de grandeza pro
// dono acompanhar, não é fatura oficial (a fatura real vem do provedor).
const PRECO_ENTRADA_POR_MILHAO = 0.27
const PRECO_SAIDA_POR_MILHAO = 1.1

export default function WhatsAppTab({ estabelecimento, readOnly }: WhatsAppTabProps) {
  const supabase = createClient()

  const [ativado, setAtivado] = useState(estabelecimento.whatsapp_robo_ativado || false)
  const [status, setStatus] = useState(estabelecimento.whatsapp_status || 'nao_conectado')
  const [phoneNumberId, setPhoneNumberId] = useState(estabelecimento.whatsapp_phone_number_id || '')
  const [accessToken, setAccessToken] = useState('')
  const [atalhos, setAtalhos] = useState<Atalho[]>(estabelecimento.whatsapp_atalhos || [])
  const [salvandoConexao, setSalvandoConexao] = useState(false)
  const [salvandoAtalhos, setSalvandoAtalhos] = useState(false)
  const [mensagemConexao, setMensagemConexao] = useState<string | null>(null)
  const [mensagemAtalhos, setMensagemAtalhos] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [esperandoHumano, setEsperandoHumano] = useState(0)
  const [mostrarTeste, setMostrarTeste] = useState(false)

  useEffect(() => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    supabase
      .from('whatsapp_metricas_log')
      .select('resolvido_por, tokens_entrada, tokens_saida')
      .eq('estabelecimento_id', estabelecimento.id)
      .gte('criado_em', inicioMes.toISOString())
      .then(({ data }: { data: { resolvido_por: string; tokens_entrada: number | null; tokens_saida: number | null }[] | null }) => {
        const linhas = data || []
        const atalho = linhas.filter((l) => l.resolvido_por === 'atalho').length
        const respostasIa = linhas.filter((l) => l.resolvido_por === 'ia')
        const custoEstimadoUsd = respostasIa.reduce(
          (soma, l) =>
            soma +
            ((l.tokens_entrada || 0) / 1_000_000) * PRECO_ENTRADA_POR_MILHAO +
            ((l.tokens_saida || 0) / 1_000_000) * PRECO_SAIDA_POR_MILHAO,
          0
        )
        setMetricas({ atalho, ia: respostasIa.length, custoEstimadoUsd })
      })

    supabase
      .from('whatsapp_conversas')
      .select('id', { count: 'exact', head: true })
      .eq('estabelecimento_id', estabelecimento.id)
      .eq('precisa_humano', true)
      .then(({ count }: { count: number | null }) => setEsperandoHumano(count || 0))
  }, [estabelecimento.id, supabase])

  async function salvarToggleRobo(novo: boolean) {
    if (readOnly) return
    setAtivado(novo)
    await supabase.from('estabelecimentos').update({ whatsapp_robo_ativado: novo }).eq('id', estabelecimento.id)
  }

  async function salvarConexao() {
    if (readOnly || !phoneNumberId.trim() || !accessToken.trim()) return
    setSalvandoConexao(true)
    setMensagemConexao(null)
    try {
      const { conectado } = await salvarEVerificarConexaoWhatsApp(estabelecimento.id, phoneNumberId.trim(), accessToken.trim())
      setStatus(conectado ? 'conectado' : 'erro')
      setMensagemConexao(
        conectado ? 'Conectado com sucesso!' : 'Não foi possível conectar — confira o token e o ID do número.'
      )
    } catch (err) {
      setMensagemConexao(err instanceof Error ? err.message : 'Erro ao salvar conexão.')
    }
    setSalvandoConexao(false)
  }

  async function salvarAtalhos(novos: Atalho[]) {
    if (readOnly) return
    setAtalhos(novos)
    setSalvandoAtalhos(true)
    const { error } = await supabase.from('estabelecimentos').update({ whatsapp_atalhos: novos }).eq('id', estabelecimento.id)
    setSalvandoAtalhos(false)
    setMensagemAtalhos(error ? 'Erro ao salvar: ' + error.message : 'Salvo!')
    setTimeout(() => setMensagemAtalhos(null), 2000)
  }

  const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
    conectado: { texto: '🟢 Conectado', cor: 'text-emerald-700' },
    erro: { texto: '🔴 Erro de conexão', cor: 'text-red-700' },
    nao_conectado: { texto: '⚪ Não conectado', cor: 'text-neutral-500' },
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">💬 Robô de Atendimento no WhatsApp</h3>
        <p className="text-sm text-gray-400 mb-4">
          Responde dúvidas de cardápio automaticamente pelo WhatsApp do estabelecimento, com base nos mesmos
          dados e regras do teste em <code className="text-xs">/cardapio/{estabelecimento.slug || '...'}/teste-ai</code>.
        </p>
      </div>

      {/* Liga/desliga geral */}
      <div className="py-3 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="switch"
            aria-checked={ativado}
            onClick={() => !readOnly && salvarToggleRobo(!ativado)}
            className={`relative w-9 h-5 rounded-full transition-colors ${ativado ? 'bg-orange-500' : 'bg-gray-200'} ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                ativado ? 'translate-x-4' : ''
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">Robô ativado</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-11">
          Desligado a qualquer momento — útil quando o movimento está corrido e você prefere responder
          pessoalmente, ou se o robô estiver errando algo. Com o robô desligado, as mensagens continuam sendo
          registradas (e marcadas como &quot;esperando atendimento&quot;), só não recebem resposta automática.
        </p>
      </div>

      {/* Aviso de conversas esperando humano */}
      {esperandoHumano > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠️ {esperandoHumano} conversa{esperandoHumano > 1 ? 's' : ''} esperando atendimento humano — veja em
          Gestão → Atendimento.
        </div>
      )}

      {/* Status de conexão */}
      <div className="border-b border-gray-100 pb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Conexão com a Cloud API da Meta</h4>
        <p className={`text-sm font-medium mb-3 ${STATUS_LABEL[status]?.cor}`}>{STATUS_LABEL[status]?.texto}</p>
        <p className="text-xs text-gray-400 mb-3">
          Pegue o token de acesso permanente e o ID do número no Business Manager da Meta (WhatsApp → Configuração
          da API) e cole abaixo.
        </p>
        <div className="flex flex-col gap-2 max-w-md">
          <input
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="Phone Number ID"
            disabled={readOnly}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Access Token"
            type="password"
            disabled={readOnly}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            onClick={salvarConexao}
            disabled={readOnly || salvandoConexao || !phoneNumberId.trim() || !accessToken.trim()}
            className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {salvandoConexao ? 'Verificando...' : 'Salvar e verificar conexão'}
          </button>
          {mensagemConexao && <p className="text-xs text-gray-600">{mensagemConexao}</p>}
        </div>
      </div>

      {/* Atalhos por palavra-chave */}
      <div className="border-b border-gray-100 pb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Atalhos de resposta rápida</h4>
        <p className="text-xs text-gray-400 mb-3">
          Respondidos na hora, sem custo de IA, antes de qualquer outra coisa. <strong>Horário</strong>,{' '}
          <strong>endereço</strong> e <strong>estacionamento</strong> já respondem automaticamente com o que está
          cadastrado em Horários e Comodidades — não precisa configurar aqui. Use a lista abaixo só pra gatilhos
          extras (ex: &quot;cartão&quot;, &quot;wifi&quot;).
        </p>
        <EditorAtalhos atalhos={atalhos} readOnly={readOnly} onSalvar={salvarAtalhos} />
        {salvandoAtalhos && <p className="text-xs text-gray-400 mt-2">Salvando...</p>}
        {mensagemAtalhos && <p className="text-xs text-green-600 mt-2">{mensagemAtalhos}</p>}
      </div>

      {/* Métricas simples */}
      <div className="border-b border-gray-100 pb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Uso este mês</h4>
        {metricas ? (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <p className="text-lg font-bold text-neutral-800">{metricas.atalho + metricas.ia}</p>
              <p className="text-xs text-neutral-400">Conversas</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <p className="text-lg font-bold text-neutral-800">{metricas.atalho}</p>
              <p className="text-xs text-neutral-400">Só atalho</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-center">
              <p className="text-lg font-bold text-neutral-800">${metricas.custoEstimadoUsd.toFixed(3)}</p>
              <p className="text-xs text-neutral-400">Custo estimado (IA)</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Carregando...</p>
        )}
      </div>

      {/* Teste embutido */}
      <div>
        <button
          onClick={() => setMostrarTeste((v) => !v)}
          className="text-sm font-semibold text-orange-700 hover:underline"
        >
          {mostrarTeste ? '▾' : '▸'} Testar o robô antes de ativar
        </button>
        {mostrarTeste && estabelecimento.slug && (
          <div className="mt-4">
            <AiWaiterChat
              slug={estabelecimento.slug}
              nomeEstabelecimento={estabelecimento.nome_fantasia || estabelecimento.nome || ''}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function EditorAtalhos({
  atalhos,
  readOnly,
  onSalvar,
}: {
  atalhos: Atalho[]
  readOnly?: boolean
  onSalvar: (novos: Atalho[]) => void
}) {
  const [linhas, setLinhas] = useState<Atalho[]>(atalhos)

  function atualizarLinha(index: number, campo: keyof Atalho, valor: string) {
    setLinhas((prev) => prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)))
  }

  function removerLinha(index: number) {
    const novas = linhas.filter((_, i) => i !== index)
    setLinhas(novas)
    onSalvar(novas)
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, { gatilho: '', resposta: '' }])
  }

  return (
    <div className="flex flex-col gap-2">
      {linhas.map((linha, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-gray-100 p-3 sm:flex-row sm:items-start">
          <input
            value={linha.gatilho}
            onChange={(e) => atualizarLinha(i, 'gatilho', e.target.value)}
            onBlur={() => onSalvar(linhas)}
            placeholder="Gatilho (ex: cartão)"
            disabled={readOnly}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm sm:w-48"
          />
          <textarea
            value={linha.resposta}
            onChange={(e) => atualizarLinha(i, 'resposta', e.target.value)}
            onBlur={() => onSalvar(linhas)}
            placeholder="Resposta fixa"
            disabled={readOnly}
            rows={2}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          {!readOnly && (
            <button onClick={() => removerLinha(i)} className="self-start text-xs text-red-600 hover:underline sm:mt-2">
              Remover
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button onClick={adicionarLinha} className="self-start text-xs font-medium text-orange-700 hover:underline">
          + Adicionar atalho
        </button>
      )}
      {linhas.length === 0 && <p className="text-xs text-gray-400">Nenhum atalho extra cadastrado.</p>}
    </div>
  )
}
