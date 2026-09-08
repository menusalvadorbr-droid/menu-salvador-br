'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Receipt, UtensilsCrossed, AlertTriangle, Play, Square, BarChart3, UserRound, PieChart, MoreVertical } from 'lucide-react'
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
  // Alimentado pelo onSacolaChange de LancarPedidoGarcom — trocar de tela
  // pra 'mesas' desmonta esse componente (sai da árvore no ternário
  // abaixo), destruindo o carrinho/forma de pagamento/confirmação de Pix
  // em andamento sem aviso nenhum. Usado só pra decidir se pergunta antes.
  const [vendaEmAndamento, setVendaEmAndamento] = useState(false)
  const [valorAbertura, setValorAbertura] = useState(0)
  const [valorFechamento, setValorFechamento] = useState(0)
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(false)
  const [mostrarResumo, setMostrarResumo] = useState(false)
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false)
  const [confirmandoTrocaTela, setConfirmandoTrocaTela] = useState(false)
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

  function handleTrocarParaMesas() {
    if (vendaEmAndamento) {
      setConfirmandoTrocaTela(true)
      return
    }
    setTela('mesas')
  }

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
      {/* Barra de status do turno — uma linha só, sem quebrar. Ações
          secundárias (Resumo/Relatório/Fechar caixa) atrás de um menu — não
          competem por espaço nem empurram a altura quando a tela é
          estreita. */}
      <div className={`flex items-center justify-between gap-3 ${caixaTema.painel} px-5 py-3`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-900">
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
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuAcoesAberto((v) => !v)}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            title="Mais ações"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuAcoesAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAcoesAberto(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-neutral-100 bg-white py-1 shadow-lg">
                <button
                  onClick={() => { setMostrarResumo(true); setMenuAcoesAberto(false) }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <PieChart className="h-4 w-4 text-neutral-400" /> Resumo do caixa
                </button>
                <Link
                  href={`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessaoAberta.id}`}
                  onClick={() => setMenuAcoesAberto(false)}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <BarChart3 className="h-4 w-4 text-neutral-400" /> Relatório completo
                </Link>
                <button
                  onClick={() => { setConfirmandoFechamento(true); setMenuAcoesAberto(false) }}
                  className="flex w-full items-center gap-2 border-t border-neutral-100 px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4" /> Fechar caixa
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Venda × Mesas são modos de trabalho diferentes, não ações do mesmo
          peso — abas leves em vez de dois botões gigantes competindo com a
          ação de confirmar a venda lá dentro. */}
      <div className="flex gap-1 border-b border-neutral-200">
        <button
          onClick={() => setTela('venda')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tela === 'venda'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Receipt className="h-4 w-4" /> Venda
        </button>
        <button
          onClick={handleTrocarParaMesas}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tela === 'mesas'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" /> Mesas e pedidos
        </button>
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
          onPedidoLancado={atualizar}
          onSacolaChange={setVendaEmAndamento}
          caixaSessaoId={sessaoAberta.id}
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

      {confirmandoTrocaTela && (
        <ConfirmarAcaoModal
          titulo="Sair da venda em andamento?"
          descricao="Há uma venda em andamento com itens lançados. Sair agora descarta essa venda — continuar?"
          tom="atencao"
          confirmarLabel="Sair mesmo assim"
          onCancelar={() => setConfirmandoTrocaTela(false)}
          onConfirmar={() => {
            setConfirmandoTrocaTela(false)
            setTela('mesas')
          }}
        />
      )}

      {mostrarResumo && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Resumo do caixa</h2>
              <button
                onClick={() => setMostrarResumo(false)}
                className="rounded-lg px-2 py-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Turno em andamento — desde {formatarDuracao(sessaoAberta.aberto_em, agoraMs)}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Vendas</dt>
                <dd className="font-medium text-neutral-900">{resumo?.vendas.length || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Total em vendas</dt>
                <dd className="font-medium text-neutral-900">R$ {formatarReais(resumo?.totalVendas || 0)}</dd>
              </div>
              {(resumo?.totalDesconto || 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Descontos concedidos</dt>
                  <dd className="text-neutral-700">R$ {formatarReais(resumo?.totalDesconto || 0)}</dd>
                </div>
              )}
              {Object.entries(resumo?.porMetodoPagamento || {}).length > 0 && (
                <div className="space-y-1 border-t border-neutral-100 pt-2">
                  {Object.entries(resumo?.porMetodoPagamento || {}).map(([metodo, valor]) => (
                    <div key={metodo} className="flex justify-between text-neutral-600">
                      <dt>{metodo}</dt>
                      <dd>R$ {formatarReais(valor)}</dd>
                    </div>
                  ))}
                </div>
              )}
            </dl>

            {(resumo?.vendas.length || 0) > 0 && (
              <div className="mt-4 border-t border-neutral-100 pt-3">
                <p className="text-xs font-semibold uppercase text-neutral-400">Últimas vendas</p>
                <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto text-xs">
                  {(resumo?.vendas || []).slice(0, 8).map((v) => (
                    <li key={v.id} className="flex justify-between text-neutral-600">
                      <span>{v.mesa ? `Mesa ${v.mesa}` : v.nomeCliente || 'Balcão'} · {v.formaPagamento || '—'}</span>
                      <span className="font-medium text-neutral-900">R$ {formatarReais(v.valor)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessaoAberta.id}`}
              className="mt-4 block text-center text-xs font-medium text-emerald-700 hover:underline"
            >
              Ver relatório completo →
            </Link>
          </div>
        </div>
      )}

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
