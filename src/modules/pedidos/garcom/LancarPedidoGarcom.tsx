'use client'

import { useEffect, useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import { vincularPedidoASessaoAberta } from '@/modules/financeiro/caixaRepository'
import { useSacola } from '../customer/useSacola'
import { criarPedido, finalizarVendaImediata } from '../ordersRepository'
import { listarCardapioParaGarcom, type CategoriaComItens } from './cardapioParaGarcom'
import SeletorFormaPagamento, { METODOS_PAGAMENTO, calcularTroco } from '../components/SeletorFormaPagamento'
import type { Mesa } from '../mesas/types'
import type { TipoPedido } from '../types'

const LIMITE_CATEGORIAS_VISIVEIS = 5

// Mesmo princípio do FecharContaMesaModal: claro é o padrão (mapa de mesas
// e "Venda no balcão" em /pedidos, inalterados); escuro só quando aberto
// de dentro do Caixa (tema="escuro"), que tem visual de PDV isolado do
// resto do painel.
const ESTILOS = {
  claro: {
    modal: 'bg-white',
    borda: 'border-neutral-100',
    titulo: 'text-neutral-900',
    fechar: 'text-neutral-400 hover:text-neutral-600',
    vazio: 'text-neutral-400',
    categoria: 'text-neutral-400',
    itemBotao: 'border-neutral-100 hover:border-orange-200 hover:bg-orange-50',
    itemNome: 'text-neutral-800',
    itemPreco: 'text-neutral-900',
    sacolaTexto: 'text-neutral-700',
    qtdBotao: 'border-neutral-200 text-neutral-500',
    total: 'text-neutral-900',
    label: 'text-neutral-600',
    input: 'border-neutral-200 bg-white text-neutral-900',
    botaoPrincipal: 'bg-orange-600 hover:bg-orange-700 text-white',
    botaoToggleAtivo: 'bg-orange-600 text-white',
    separador: 'bg-neutral-100',
    separadorTexto: 'text-neutral-400',
  },
  escuro: {
    modal: 'bg-neutral-900',
    borda: 'border-neutral-800',
    titulo: 'text-white',
    fechar: 'text-neutral-500 hover:text-neutral-300',
    vazio: 'text-neutral-500',
    categoria: 'text-neutral-500',
    itemBotao: 'border-neutral-800 hover:border-emerald-500/40 hover:bg-emerald-500/10',
    itemNome: 'text-neutral-200',
    itemPreco: 'text-white',
    sacolaTexto: 'text-neutral-300',
    qtdBotao: 'border-neutral-700 text-neutral-400',
    total: 'text-white',
    label: 'text-neutral-400',
    input: 'border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-500',
    botaoPrincipal: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    botaoToggleAtivo: 'bg-emerald-600 text-white',
    separador: 'bg-neutral-800',
    separadorTexto: 'text-neutral-500',
  },
} as const

/**
 * Tela da equipe pra lançar um pedido — usada a partir de uma mesa (mapa
 * de mesas), pra venda direta no balcão (mesa=null, /pedidos) e pra "Nova
 * venda" dentro do Caixa (mesa=null, finalizarNoAto=true, modo="inline").
 * O fluxo de escolher itens é o mesmo nos três; só o "Nova venda" do Caixa
 * muda o que acontece ao confirmar — em vez de só lançar o pedido (status
 * recebido, segue o board de comandas normalmente), aplica desconto e já
 * marca como pago na hora, pulando o board — é uma venda de balcão que se
 * resolve no ato, no caixa, não um pedido que precisa de acompanhamento de
 * cozinha. `modo="inline"` renderiza sem o overlay/modal — usado quando a
 * tela de venda fica sempre aberta embutida no Caixa, não atrás de um botão.
 */
export default function LancarPedidoGarcom({
  estabelecimentoId,
  mesa,
  onFechar,
  onPedidoLancado,
  tema = 'claro',
  finalizarNoAto = false,
  modo = 'modal',
}: {
  estabelecimentoId: string
  mesa: Mesa | null
  onFechar?: () => void
  onPedidoLancado: () => void
  tema?: 'claro' | 'escuro'
  finalizarNoAto?: boolean
  modo?: 'modal' | 'inline'
}) {
  const c = ESTILOS[tema]
  const [categorias, setCategorias] = useState<CategoriaComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [modoContingencia, setModoContingencia] = useState(false)
  const [vendaConfirmada, setVendaConfirmada] = useState<number | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<string>(METODOS_PAGAMENTO[0])
  const [valorRecebido, setValorRecebido] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [buscaItem, setBuscaItem] = useState('')
  // Linha do carrinho com o controle de −/+/remover aberto — só uma por
  // vez, escondido atrás do ícone de lápis pra não poluir a lista com três
  // botões em toda linha o tempo todo.
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<string | null>(null)
  // Grade de categorias começa mostrando só as 5 primeiras — cardápio com
  // muita categoria virava uma parede de blocos antes de chegar nos itens;
  // "+ mais" revela o resto sob demanda.
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false)
  const sacola = useSacola()

  const tipoPedido: TipoPedido = mesa ? 'mesa' : 'balcao'
  const titulo = mesa ? `Mesa ${mesa.numero}` : finalizarNoAto ? 'Nova venda' : 'Venda no balcão'

  const descontoNum = calcularDesconto(sacola.total, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const totalComDesconto = Math.max(0, sacola.total - descontoNum)
  const troco = calcularTroco(formaPagamento, valorRecebido, totalComDesconto)
  const trocoInsuficiente = troco !== null && troco < 0

  const termoBusca = buscaItem.trim().toLowerCase()
  const categoriasFiltradas = categorias
    .filter((cat) => !categoriaAtiva || cat.id === categoriaAtiva)
    .map((cat) => ({
      ...cat,
      itens: termoBusca ? cat.itens.filter((item) => item.nome.toLowerCase().includes(termoBusca)) : cat.itens,
    }))
    .filter((cat) => cat.itens.length > 0)

  const categoriasNaGrade = mostrarTodasCategorias ? categorias : categorias.slice(0, LIMITE_CATEGORIAS_VISIVEIS)
  const categoriasEscondidas = categorias.length - categoriasNaGrade.length

  useEffect(() => {
    listarCardapioParaGarcom(estabelecimentoId)
      .then(setCategorias)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  function cancelarVenda() {
    if (sacola.itens.length > 0 && !confirm('Cancelar essa venda e limpar os itens já lançados?')) return
    sacola.limparSacola()
    setDescontoInput('')
    setValorRecebido('')
    setFormaPagamento(METODOS_PAGAMENTO[0])
    setLinhaEmEdicao(null)
  }

  async function lancarPedido() {
    if (sacola.itens.length === 0) return
    if (trocoInsuficiente) return
    setEnviando(true)

    // Registra quem lançou o pedido — usado no demonstrativo de caixa como
    // "funcionário responsável". Pedido feito pelo próprio cliente (QR) não
    // passa por aqui, então fica sem staff_id, corretamente.
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const resposta = await criarPedido({
      estabelecimento_id: estabelecimentoId,
      items: sacola.itens,
      total: sacola.total,
      tipo_pedido: tipoPedido,
      mesa: mesa?.numero,
      mesa_id: mesa?.id,
      origem: 'garcom',
      staff_id: user?.id,
    })

    // Modo caixa: fecha o pagamento na hora, sem passar pelo board de
    // comandas. Só dá pra fazer isso online — em contingência não existe
    // pedidoId ainda (fica na fila local), então cai no aviso normal.
    if (finalizarNoAto && resposta.modo === 'online' && resposta.pedidoId) {
      try {
        await finalizarVendaImediata(resposta.pedidoId, totalComDesconto, descontoNum, formaPagamento)
        // Pedido nasceu e já foi pago nesse mesmo instante — nunca passou
        // por "em_preparo", então a baixa de estoque nunca rodou; roda
        // aqui, uma vez, incondicionalmente.
        try {
          await baixarEstoquePorItens(
            estabelecimentoId,
            sacola.itens.map((item) => ({ itemCardapioId: item.id, quantidade: item.quantidade }))
          )
        } catch (err) {
          // Não trava a venda — mesmo comportamento do fechamento de mesa.
          // Loga pra dar pra investigar depois (item sem ficha vinculada,
          // erro de conversão de unidade, tabela não exposta no Supabase etc.)
          console.error('Falha ao dar baixa no estoque da venda balcão:', err)
        }
        try {
          await vincularPedidoASessaoAberta(estabelecimentoId, resposta.pedidoId)
        } catch {
          // Sem caixa aberto não deve travar a venda.
        }
        setEnviando(false)
        setVendaConfirmada(totalComDesconto)
        setTimeout(() => {
          sacola.limparSacola()
          setVendaConfirmada(null)
          setDescontoInput('')
          setValorRecebido('')
          setLinhaEmEdicao(null)
          onPedidoLancado()
        }, 1500)
        return
      } catch (err) {
        setEnviando(false)
        alert(`Pedido criado, mas não foi possível confirmar o pagamento: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
        sacola.limparSacola()
        setLinhaEmEdicao(null)
        onPedidoLancado()
        return
      }
    }

    setEnviando(false)

    if (resposta.modo === 'contingencia') {
      // Sem WhatsApp aqui — o garçom já está dentro do sistema, só avisamos
      // que ficou salvo localmente e será sincronizado sozinho.
      setModoContingencia(true)
      setTimeout(() => {
        sacola.limparSacola()
        setModoContingencia(false)
        setLinhaEmEdicao(null)
        onPedidoLancado()
      }, 1800)
    } else {
      sacola.limparSacola()
      setLinhaEmEdicao(null)
      onPedidoLancado()
    }
  }

  const filtro = (
    <div className="mb-3 space-y-2">
      <input
        type="text"
        value={buscaItem}
        onChange={(e) => setBuscaItem(e.target.value)}
        placeholder="🔎 Buscar item ou código…"
        className={`w-full rounded-lg border px-3 py-2 text-sm ${c.input}`}
      />
      {/* Grade de categorias em vez de pílulas — alvo de toque maior,
          melhor pra um terminal de caixa usado com o dedo. */}
      {categorias.length > 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button
            onClick={() => setCategoriaAtiva(null)}
            className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
              !categoriaAtiva ? c.botaoToggleAtivo : `${c.itemBotao}`
            }`}
          >
            Todas
            <span className="mt-0.5 block text-xs font-normal opacity-70">
              {categorias.reduce((soma, cat) => soma + cat.itens.length, 0)} itens
            </span>
          </button>
          {categoriasNaGrade.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                categoriaAtiva === cat.id ? c.botaoToggleAtivo : c.itemBotao
              }`}
            >
              {cat.nome}
              <span className="mt-0.5 block text-xs font-normal opacity-70">{cat.itens.length} itens</span>
            </button>
          ))}
          {categoriasEscondidas > 0 ? (
            <button
              onClick={() => setMostrarTodasCategorias(true)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${c.itemBotao}`}
            >
              + {categoriasEscondidas} mais
              <span className="mt-0.5 block text-xs font-normal opacity-70">ver categorias</span>
            </button>
          ) : (
            mostrarTodasCategorias &&
            categorias.length > LIMITE_CATEGORIAS_VISIVEIS && (
              <button
                onClick={() => setMostrarTodasCategorias(false)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${c.itemBotao}`}
              >
                Mostrar menos
              </button>
            )
          )}
        </div>
      )}
    </div>
  )

  const listaCardapio = (
    <>
      {filtro}
      {categoriasFiltradas.map((cat) => (
        <div key={cat.id} className="mb-4">
          <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${c.categoria}`}>
            {cat.nome}
          </h3>
          <div className="flex flex-col gap-2">
            {cat.itens.map((item) => {
              const preco = item.preco_promocional ?? item.preco
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    sacola.adicionarItem({ id: item.id, nome: item.nome, preco: item.preco, preco_promocional: item.preco_promocional || undefined })
                  }
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${c.itemBotao}`}
                >
                  <span className={c.itemNome}>{item.nome}</span>
                  <span className={`font-semibold ${c.itemPreco}`}>R$ {preco.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {categoriasFiltradas.length === 0 && (
        <p className={`py-8 text-center text-sm ${c.vazio}`}>
          {categorias.length === 0 ? 'Cardápio vazio.' : 'Nenhum item encontrado.'}
        </p>
      )}
    </>
  )

  const corpo = (
    <>
      {modo === 'modal' && (
        <div className={`flex items-center justify-between border-b ${c.borda} p-4`}>
          <h2 className={`text-lg font-bold ${c.titulo}`}>{titulo}</h2>
          <button onClick={onFechar} className={c.fechar}>✕</button>
        </div>
      )}

      {vendaConfirmada !== null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="text-3xl">✅</span>
          <p className={`text-sm font-medium ${c.titulo}`}>Venda registrada — R$ {vendaConfirmada.toFixed(2)}</p>
        </div>
      ) : modoContingencia ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="text-3xl">💾</span>
          <p className={`text-sm font-medium ${c.titulo}`}>
            Sem conexão no momento — pedido salvo localmente e será sincronizado automaticamente.
          </p>
        </div>
      ) : carregando ? (
        <div className={`flex flex-1 items-center justify-center p-8 ${c.vazio}`}>Carregando cardápio...</div>
      ) : finalizarNoAto ? (
        // Modo caixa: carrinho sempre visível (esquerda no desktop, embaixo
        // no mobile) mostrando o que já foi lançado e o subtotal ao vivo —
        // a venda só fecha quando o caixa confirma no fim, não item a item.
        <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="order-1 flex-1 overflow-y-auto p-4 sm:order-2">
            {listaCardapio}
          </div>

          <div
            className={`order-2 flex flex-col gap-3 border-t p-4 sm:order-1 sm:w-72 sm:flex-shrink-0 sm:border-r sm:border-t-0 ${c.borda}`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>🧾 Itens da venda</p>
            <div className="flex-1 space-y-1.5 overflow-y-auto text-sm">
              {sacola.itens.length === 0 ? (
                <p className={`text-sm ${c.vazio}`}>Toque num item do cardápio pra adicionar.</p>
              ) : (
                sacola.itens.map((item) => {
                  const linhaId = item.linhaId || item.id
                  const preco = item.preco_promocional ?? item.preco
                  const editando = linhaEmEdicao === linhaId
                  return (
                    <div key={linhaId}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate ${c.sacolaTexto}`}>
                          {item.quantidade}x {item.nome}
                        </span>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className={`font-semibold ${c.itemPreco}`}>R$ {(preco * item.quantidade).toFixed(2)}</span>
                          <button
                            onClick={() => setLinhaEmEdicao(editando ? null : linhaId)}
                            title="Alterar quantidade"
                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition ${
                              editando ? c.botaoToggleAtivo : c.qtdBotao
                            }`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {editando && (
                        <div className="mt-1.5 flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => sacola.alterarQuantidade(linhaId, -1)}
                            className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}
                          >
                            −
                          </button>
                          <span className={`w-5 text-center text-xs ${c.sacolaTexto}`}>{item.quantidade}</span>
                          <button
                            onClick={() => sacola.alterarQuantidade(linhaId, 1)}
                            className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}
                          >
                            +
                          </button>
                          <button
                            onClick={() => {
                              sacola.removerItem(linhaId)
                              setLinhaEmEdicao(null)
                            }}
                            title="Remover item"
                            className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-red-500 transition hover:bg-red-500/10"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {sacola.itens.length > 0 && (
              <div className={`space-y-3 border-t pt-3 ${c.borda}`}>
                <div>
                  <label className={`mb-1 block text-xs font-medium ${c.label}`}>
                    Desconto <span className="font-normal opacity-70">(opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className={`flex overflow-hidden rounded-lg border ${c.borda}`}>
                      <button
                        type="button"
                        onClick={() => setTipoDesconto('valor')}
                        className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'valor' ? c.botaoToggleAtivo : c.label}`}
                      >
                        R$
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoDesconto('percentual')}
                        className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'percentual' ? c.botaoToggleAtivo : c.label}`}
                      >
                        %
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={descontoInput}
                      onChange={(e) => setDescontoInput(e.target.value)}
                      placeholder={tipoDesconto === 'percentual' ? 'Ex: 10' : 'Ex: 5,00'}
                      className={`flex-1 rounded-lg border px-3 py-2 ${c.input}`}
                    />
                  </div>
                </div>

                <SeletorFormaPagamento
                  formaPagamento={formaPagamento}
                  onChangeFormaPagamento={setFormaPagamento}
                  valorRecebido={valorRecebido}
                  onChangeValorRecebido={setValorRecebido}
                  total={totalComDesconto}
                  tema={tema}
                />

                <div className={`space-y-1 border-t pt-3 text-sm ${c.borda}`}>
                  <div className={`flex justify-between ${c.label}`}>
                    <span>Subtotal</span>
                    <span>R$ {sacola.total.toFixed(2)}</span>
                  </div>
                  {descontoNum > 0 && (
                    <div className={`flex justify-between ${c.label}`}>
                      <span>Desconto</span>
                      <span>− R$ {descontoNum.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-base font-bold ${c.total}`}>
                    <span>Total a pagar</span>
                    <span>R$ {totalComDesconto.toFixed(2)}</span>
                  </div>
                </div>

                {trocoInsuficiente && (
                  <p className="text-xs font-medium text-red-500">Valor recebido menor que o total — confira antes de confirmar.</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={cancelarVenda}
                    disabled={enviando}
                    title="F2 — Cancelar"
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${c.borda} ${c.label} ${
                      tema === 'escuro' ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={lancarPedido}
                    disabled={enviando || trocoInsuficiente}
                    title="F10 — Pagamento / Finalizar"
                    className={`flex-1 rounded-lg py-3 text-base font-bold transition disabled:opacity-50 ${c.botaoPrincipal}`}
                  >
                    {enviando ? 'Confirmando...' : `Confirmar venda — R$ ${totalComDesconto.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">{listaCardapio}</div>

          {sacola.itens.length > 0 && (
            <div className={`border-t ${c.borda} p-4`}>
              <div className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm">
                {sacola.itens.map((item) => {
                  const linhaId = item.linhaId || item.id
                  const preco = item.preco_promocional ?? item.preco
                  const editando = linhaEmEdicao === linhaId
                  return (
                  <div key={linhaId}>
                    <div className="flex items-center justify-between">
                      <span className={c.sacolaTexto}>
                        {item.quantidade}x {item.nome}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${c.itemPreco}`}>R$ {(preco * item.quantidade).toFixed(2)}</span>
                        <button
                          onClick={() => setLinhaEmEdicao(editando ? null : linhaId)}
                          title="Alterar quantidade"
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs transition ${
                            editando ? c.botaoToggleAtivo : c.qtdBotao
                          }`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {editando && (
                      <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => sacola.alterarQuantidade(linhaId, -1)}
                          className={`h-6 w-6 rounded-full border ${c.qtdBotao}`}
                        >
                          −
                        </button>
                        <span className={`w-5 text-center text-xs ${c.sacolaTexto}`}>{item.quantidade}</span>
                        <button
                          onClick={() => sacola.alterarQuantidade(linhaId, 1)}
                          className={`h-6 w-6 rounded-full border ${c.qtdBotao}`}
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            sacola.removerItem(linhaId)
                            setLinhaEmEdicao(null)
                          }}
                          title="Remover item"
                          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-red-500 transition hover:bg-red-500/10"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>

              <div className={`mb-3 flex justify-between text-base font-bold ${c.total}`}>
                <span>Total</span>
                <span>R$ {sacola.total.toFixed(2)}</span>
              </div>
              <button
                onClick={lancarPedido}
                disabled={enviando}
                className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${c.botaoPrincipal}`}
              >
                {enviando ? 'Lançando...' : mesa ? `Lançar pedido — Mesa ${mesa.numero}` : 'Lançar venda no balcão'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )

  if (modo === 'inline') {
    return <div className={`flex min-h-[60vh] flex-col rounded-xl border ${c.borda} ${c.modal}`}>{corpo}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div
        className={`relative flex max-h-[85vh] w-full flex-col rounded-t-2xl ${c.modal} shadow-2xl sm:rounded-2xl ${
          finalizarNoAto ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        {corpo}
      </div>
    </div>
  )
}
