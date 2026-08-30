'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Receipt, UtensilsCrossed, AlertTriangle, Play, Square, BarChart3, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCaixa } from '../hooks/useCaixa'
import MesasComContaAberta from './MesasComContaAberta'
import PedidosAvulsosPendentes from './PedidosAvulsosPendentes'
import MovimentacoesCaixa from './MovimentacoesCaixa'
import InputMoeda from './InputMoeda'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import LancarPedidoGarcom from '@/modules/pedidos/garcom/LancarPedidoGarcom'
import { formatarReais } from '@/lib/moeda'
import { caixaTema } from '../caixaTema'

// Turno aberto por mais que isso acende o alerta de "turno longo" na barra
// de status — sinal de que provavelmente esqueceram de fechar o caixa.
const LIMITE_TURNO_LONGO_HORAS = 12

function formatarDuracao(desdeIso: string, agoraMs: number): string {
  const minutos = Math.max(0, Math.floor((agoraMs - new Date(desdeIso).getTime()) / 60000))
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

type Tela = 'venda' | 'mesas'

export default function PainelCaixa({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { sessaoAberta, resumo, carregando, abrir, fechar, atualizar } = useCaixa(estabelecimentoId)
  const [tela, setTela] = useState<Tela>('venda')
  const [valorAbertura, setValorAbertura] = useState(0)
  const [valorFechamento, setValorFechamento] = useState(0)
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false)
  const [resultadoFechamento, setResultadoFechamento] = useState<{ diferenca: number } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // "Agora" só existe como estado, atualizado por um intervalo — nunca
  // lido direto (Date.now()) durante o render, que é impuro e quebra a
  // regra de pureza de render do React (podia dar resultado diferente a
  // cada chamada, inclusive no double-render do StrictMode).
  const [agoraMs, setAgoraMs] = useState(() => Date.now())
  // Quem está no terminal agora — não necessariamente quem abriu o turno
  // (pode ter passado o caixa pra outra pessoa no meio do dia), então
  // busca o usuário logado, não sessaoAberta.aberto_por.
  const [operadorNome, setOperadorNome] = useState<string | null>(null)

  useEffect(() => {
    const intervalo = setInterval(() => setAgoraMs(Date.now()), 30000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: perfil } = await supabase.from('profiles').select('nome, email').eq('id', user.id).maybeSingle()
      setOperadorNome(perfil?.nome || perfil?.email || null)
    })
  }, [])

  const valorEsperado =
    (sessaoAberta?.valor_abertura || 0) +
    (resumo?.totalVendas || 0) +
    (resumo?.totalSuprimentos || 0) -
    (resumo?.totalSangrias || 0)

  const turnoLongo =
    sessaoAberta != null &&
    agoraMs - new Date(sessaoAberta.aberto_em).getTime() > LIMITE_TURNO_LONGO_HORAS * 60 * 60 * 1000

  async function handleAbrir() {
    setEnviando(true)
    setErro(null)
    try {
      await abrir(valorAbertura)
      setValorAbertura(0)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao abrir o caixa')
    } finally {
      setEnviando(false)
    }
  }

  async function handleFechar() {
    setEnviando(true)
    setErro(null)
    try {
      const sessao = await fechar(valorFechamento)
      if (sessao) setResultadoFechamento({ diferenca: sessao.diferenca || 0 })
      setValorFechamento(0)
      setConfirmandoFechamento(false)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fechar o caixa')
      setConfirmandoFechamento(false)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        <div className={`h-20 ${caixaTema.skeleton}`} />
        <div className={`h-[60vh] ${caixaTema.skeleton}`} />
      </div>
    )
  }

  if (resultadoFechamento) {
    const { diferenca } = resultadoFechamento
    return (
      <div className={`mx-auto max-w-sm ${caixaTema.painel} p-8 text-center`}>
        <div className="mb-2 text-5xl">{diferenca === 0 ? '✅' : diferenca > 0 ? '📈' : '📉'}</div>
        <h2 className="text-lg font-bold text-neutral-900">Caixa fechado</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {diferenca === 0
            ? 'Bateu certinho com o valor esperado.'
            : diferenca > 0
              ? `Sobrou R$ ${formatarReais(diferenca)} em relação ao esperado.`
              : `Faltou R$ ${formatarReais(Math.abs(diferenca))} em relação ao esperado.`}
        </p>
        <button
          onClick={() => setResultadoFechamento(null)}
          className={`mt-5 w-full rounded-lg py-2.5 text-sm font-semibold ${caixaTema.botaoNeutro}`}
        >
          Voltar
        </button>
      </div>
    )
  }

  if (!sessaoAberta) {
    return (
      <div className="space-y-6">
        {/* Fechar conta de mesa exige caixa aberto (pagamento precisa
            pertencer a um turno) — não mostra essa ferramenta aqui pra não
            sugerir que dá pra fechar mesa com o caixa fechado. */}
        <div className={`mx-auto max-w-sm ${caixaTema.painel} p-8 text-center`}>
          <div className="mb-3 text-5xl">🔒</div>
          <h2 className="text-lg font-bold text-neutral-900">Caixa fechado</h2>
          <p className="mt-1 text-sm text-neutral-500">Informe o valor inicial para abrir o caixa.</p>
          {erro && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}
          <InputMoeda
            value={valorAbertura}
            onChange={setValorAbertura}
            autoFocus
            className={`mt-4 w-full text-center text-lg ${caixaTema.input}`}
          />
          <button
            onClick={handleAbrir}
            disabled={enviando}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-base font-bold ${caixaTema.botaoVerde}`}
          >
            <Play className="h-4 w-4" /> {enviando ? 'Abrindo...' : 'Abrir caixa'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de status do turno — só o essencial, nada de números de
          vendas passadas aqui; isso mora no relatório (link abaixo). */}
      <div className={`flex flex-wrap items-center justify-between gap-3 ${caixaTema.painel} px-5 py-3`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              Caixa aberto
              {turnoLongo && (
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${caixaTema.badgeAlerta}`}>
                  <AlertTriangle className="h-3 w-3" /> turno longo
                </span>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatarDuracao(sessaoAberta.aberto_em, agoraMs)}
              </span>
              {operadorNome && (
                <span className="flex items-center gap-1">
                  <UserRound className="h-3 w-3" /> {operadorNome}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessaoAberta.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-emerald-700"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Relatório
          </Link>
          <button
            onClick={() => setConfirmandoFechamento(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <Square className="h-3.5 w-3.5" /> Fechar caixa
          </button>
        </div>
      </div>

      {/* Tela central — limpa: só o que está em uso agora (vender ou
          acompanhar mesas/pedidos), nada de histórico de vendas. */}
      {tela === 'venda' ? (
        <LancarPedidoGarcom
          key={sessaoAberta.id}
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          finalizarNoAto
          modo="inline"
          onPedidoLancado={() => {}}
        />
      ) : (
        <div className="space-y-4">
          <MesasComContaAberta estabelecimentoId={estabelecimentoId} />
          <PedidosAvulsosPendentes estabelecimentoId={estabelecimentoId} caixaAberto={!!sessaoAberta} onFechado={atualizar} />
          <MovimentacoesCaixa
            estabelecimentoId={estabelecimentoId}
            caixaSessaoId={sessaoAberta.id}
            movimentacoes={resumo?.movimentacoes || []}
            onRegistrada={atualizar}
          />
          <Link
            href={`/painel/estabelecimento/${estabelecimentoId}/pedidos`}
            className="block text-center text-xs font-medium text-emerald-700 hover:underline"
          >
            Ver quadro de comandas completo →
          </Link>
        </div>
      )}

      {/* Botões de alternância — sempre visíveis, sem precisar rolar a
          tela pra trocar entre vender e acompanhar mesas. Alinhados à
          direita (desktop) pra ficar sob a coluna do cardápio, que também
          fica à direita dentro de LancarPedidoGarcom — não empurram mais
          a largura toda como um bloco só. */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={() => setTela('venda')}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold shadow-lg transition sm:w-56 ${
            tela === 'venda' ? caixaTema.botaoVerde : caixaTema.botaoNeutro
          }`}
        >
          <Receipt className="h-5 w-5" /> Nova venda
        </button>
        <button
          onClick={() => setTela('mesas')}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold shadow-lg transition sm:w-56 ${
            tela === 'mesas' ? caixaTema.botaoVerde : caixaTema.botaoNeutro
          }`}
        >
          <UtensilsCrossed className="h-5 w-5" /> Mesas e pedidos
        </button>
      </div>

      {confirmandoFechamento && (
        <ConfirmarAcaoModal
          titulo="Fechar o caixa"
          tom="perigo"
          enviando={enviando}
          confirmarLabel="Confirmar fechamento"
          onCancelar={() => setConfirmandoFechamento(false)}
          onConfirmar={handleFechar}
          descricao={
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">Valor contado na gaveta</label>
                <InputMoeda value={valorFechamento} onChange={setValorFechamento} autoFocus className={`w-full ${caixaTema.input}`} />
              </div>
              {erro && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
              )}
              <div className="space-y-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Esperado na gaveta</span>
                  <span className="font-semibold text-neutral-900">R$ {formatarReais(valorEsperado)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor contado</span>
                  <span className="font-semibold text-neutral-900">R$ {formatarReais(valorFechamento)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-1">
                  <span>Diferença</span>
                  <span
                    className={`font-semibold ${
                      valorFechamento - valorEsperado === 0
                        ? 'text-emerald-600'
                        : valorFechamento - valorEsperado > 0
                          ? 'text-sky-600'
                          : 'text-red-600'
                    }`}
                  >
                    R$ {formatarReais(valorFechamento - valorEsperado)}
                  </span>
                </div>
              </div>
            </div>
          }
        />
      )}
    </div>
  )
}
