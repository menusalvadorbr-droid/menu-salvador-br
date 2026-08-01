'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import { vincularPedidoASessaoAberta } from '@/modules/financeiro/caixaRepository'
import { useSacola } from '../customer/useSacola'
import { criarPedido, finalizarVendaImediata } from '../ordersRepository'
import { listarCardapioParaGarcom, type CategoriaComItens } from './cardapioParaGarcom'
import type { Mesa } from '../mesas/types'
import type { TipoPedido } from '../types'

const METODOS_PAGAMENTO = ['Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Pix']

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
  const [formaPagamento, setFormaPagamento] = useState(METODOS_PAGAMENTO[0])
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [buscaItem, setBuscaItem] = useState('')
  const sacola = useSacola()

  const tipoPedido: TipoPedido = mesa ? 'mesa' : 'balcao'
  const titulo = mesa ? `Mesa ${mesa.numero}` : finalizarNoAto ? 'Nova venda' : 'Venda no balcão'

  const descontoNum = calcularDesconto(sacola.total, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const totalComDesconto = Math.max(0, sacola.total - descontoNum)

  const termoBusca = buscaItem.trim().toLowerCase()
  const categoriasFiltradas = categorias
    .filter((cat) => !categoriaAtiva || cat.id === categoriaAtiva)
    .map((cat) => ({
      ...cat,
      itens: termoBusca ? cat.itens.filter((item) => item.nome.toLowerCase().includes(termoBusca)) : cat.itens,
    }))
    .filter((cat) => cat.itens.length > 0)

  useEffect(() => {
    listarCardapioParaGarcom(estabelecimentoId)
      .then(setCategorias)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  async function lancarPedido() {
    if (sacola.itens.length === 0) return
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
          await baixarEstoquePorItens(sacola.itens.map((item) => ({ itemCardapioId: item.id, quantidade: item.quantidade })))
        } catch {
          // Não trava a venda — mesmo comportamento do fechamento de mesa.
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
          onPedidoLancado()
        }, 1500)
        return
      } catch (err) {
        setEnviando(false)
        alert(`Pedido criado, mas não foi possível confirmar o pagamento: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
        sacola.limparSacola()
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
        onPedidoLancado()
      }, 1800)
    } else {
      sacola.limparSacola()
      onPedidoLancado()
    }
  }

  const filtro = (
    <div className="mb-3 space-y-2">
      <input
        type="text"
        value={buscaItem}
        onChange={(e) => setBuscaItem(e.target.value)}
        placeholder="🔎 Buscar item…"
        className={`w-full rounded-lg border px-3 py-2 text-sm ${c.input}`}
      />
      {categorias.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoriaAtiva(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              !categoriaAtiva ? c.botaoToggleAtivo : `border ${c.borda} ${c.label}`
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                categoriaAtiva === cat.id ? c.botaoToggleAtivo : `border ${c.borda} ${c.label}`
              }`}
            >
              {cat.nome}
            </button>
          ))}
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
                sacola.itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className={`truncate ${c.sacolaTexto}`}>
                      {item.quantidade}x {item.nome}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => sacola.alterarQuantidade(item.id, item.quantidade - 1)}
                        className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}
                      >
                        −
                      </button>
                      <button
                        onClick={() => sacola.alterarQuantidade(item.id, item.quantidade + 1)}
                        className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
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

                <div>
                  <label className={`mb-1 block text-xs font-medium ${c.label}`}>Forma de pagamento</label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 ${c.input}`}
                  >
                    {METODOS_PAGAMENTO.map((metodo) => (
                      <option key={metodo}>{metodo}</option>
                    ))}
                  </select>
                </div>

                <div className={`flex justify-between text-base font-bold ${c.total}`}>
                  <span>Total</span>
                  <span>
                    {descontoNum > 0 && (
                      <span className="mr-2 text-sm font-normal line-through opacity-50">R$ {sacola.total.toFixed(2)}</span>
                    )}
                    R$ {totalComDesconto.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={lancarPedido}
                  disabled={enviando}
                  className={`w-full rounded-lg py-3 text-base font-bold transition disabled:opacity-50 ${c.botaoPrincipal}`}
                >
                  {enviando ? 'Confirmando...' : `Confirmar venda — R$ ${totalComDesconto.toFixed(2)}`}
                </button>
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
                {sacola.itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className={c.sacolaTexto}>
                      {item.quantidade}x {item.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sacola.alterarQuantidade(item.id, item.quantidade - 1)}
                        className={`h-6 w-6 rounded-full border ${c.qtdBotao}`}
                      >
                        −
                      </button>
                      <button
                        onClick={() => sacola.alterarQuantidade(item.id, item.quantidade + 1)}
                        className={`h-6 w-6 rounded-full border ${c.qtdBotao}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
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
