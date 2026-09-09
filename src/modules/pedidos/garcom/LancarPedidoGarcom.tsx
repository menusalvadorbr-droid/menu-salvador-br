'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import { formatarReais } from '@/lib/moeda'
import { baixarEstoquePorItens } from '@/modules/estoque/estoqueRepository'
import { vincularPedidoASessaoAberta } from '@/modules/financeiro/caixaRepository'
import { useSacola } from '../customer/useSacola'
import { criarPedido, finalizarVendaImediata, atualizarItensPedido } from '../ordersRepository'
import { listarCardapioParaGarcom, type CategoriaComItens } from './cardapioParaGarcom'
import { calcularTroco } from '../components/SeletorFormaPagamento'
import { buscarDadosPixEstabelecimento, type DadosPixEstabelecimento } from '@/lib/pix/buscarDadosPixEstabelecimento'
import { ESTILOS_GARCOM } from './estilosGarcom'
import SeletorCardapioGarcom from './SeletorCardapioGarcom'
import LinhaCarrinhoGarcom from './LinhaCarrinhoGarcom'
import PainelPagamentoGarcom from './PainelPagamentoGarcom'
import VendasPausadasBarra from './VendasPausadasBarra'
import {
  listarVendasPausadas,
  pausarVenda as pausarVendaNoBanco,
  excluirVendaPausada,
  type VendaBalcaoPausada,
} from './vendasPausadasRepository'
import type { Mesa } from '../mesas/types'
import type { Pedido, TipoPedido } from '../types'

// Fora do componente de propósito — Math.random() dentro do corpo do
// componente é sinalizado pela regra de pureza do React (mesmo motivo do
// referenciaPixSeqRef abaixo); só é chamada dentro de um inicializador
// preguiçoso de useState ou de um handler, nunca durante o render em si.
function gerarCodigoVenda(): string {
  return String(Math.floor(Math.random() * 900) + 100)
}

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
 *
 * Este arquivo é só o orquestrador (estado + regras de negócio); a UI de
 * cada parte mora em componentes próprios — SeletorCardapioGarcom (busca +
 * categorias + lista de itens), PainelPagamentoGarcom (desconto + forma de
 * pagamento + Pix, só no modo Caixa) e LinhaCarrinhoGarcom (uma linha da
 * sacola, reaproveitada nos dois layouts abaixo).
 */
export default function LancarPedidoGarcom({
  estabelecimentoId,
  mesa,
  onFechar,
  onPedidoLancado,
  tema = 'claro',
  finalizarNoAto = false,
  modo = 'modal',
  pedidoEmEdicao,
  onPedidoAtualizado,
  onSacolaChange,
  caixaSessaoId,
}: {
  estabelecimentoId: string
  mesa: Mesa | null
  onFechar?: () => void
  onPedidoLancado: () => void
  tema?: 'claro' | 'escuro'
  finalizarNoAto?: boolean
  modo?: 'modal' | 'inline'
  // Quando presente, o componente abre em modo edição: sacola pré-
  // preenchida com os itens do pedido, e "confirmar" atualiza esse pedido
  // em vez de criar um novo. Usado pelos cards de Pix/Validar entrega da
  // Fila do Operador, sempre antes de pagamento/preparo — nenhuma checagem
  // extra de elegibilidade aqui, quem chama já garante isso pela lista de
  // origem (ver operadorRepository.ts).
  pedidoEmEdicao?: Pedido
  onPedidoAtualizado?: () => void
  // Avisa quem chama se há itens lançados nessa venda ainda não
  // confirmada — usado pelo Caixa (modo="inline") pra evitar que o botão
  // "Mesas e pedidos" desmonte esse componente (e todo o estado da venda
  // em andamento junto) sem aviso.
  onSacolaChange?: (temItens: boolean) => void
  // Sessão de caixa aberta — só usado no modo Caixa (finalizarNoAto), pra
  // "pausar venda" ficar preso ao turno corrente (ver
  // vendasPausadasRepository.ts). Sem isso, "Pausar" não aparece.
  caixaSessaoId?: string
}) {
  const c = ESTILOS_GARCOM[tema]
  const [categorias, setCategorias] = useState<CategoriaComItens[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [modoContingencia, setModoContingencia] = useState(false)
  const [vendaConfirmada, setVendaConfirmada] = useState<number | null>(null)
  // Sem valor padrão de propósito — o caixa clicava direto em "Confirmar
  // venda" achando que já tinha escolhido a forma de pagamento, quando na
  // verdade era só o primeiro botão pré-marcado. Fica sem seleção até o
  // operador tocar num método de verdade.
  const [formaPagamento, setFormaPagamento] = useState<string>('')
  const [valorRecebido, setValorRecebido] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [buscaItem, setBuscaItem] = useState('')
  // Linha do carrinho com o controle de −/+/remover aberto — só uma por
  // vez, escondido atrás do ícone de lápis pra não poluir a lista com três
  // botões em toda linha o tempo todo.
  const [linhaEmEdicao, setLinhaEmEdicao] = useState<string | null>(null)
  const [dadosPix, setDadosPix] = useState<DadosPixEstabelecimento | null>(null)
  const [pixConfirmado, setPixConfirmado] = useState(false)
  // Referência do BR Code — regenerada a cada início de venda nova (ver
  // reiniciarVenda), não só uma vez, porque este componente fica montado
  // pra várias vendas seguidas dentro da mesma sessão de caixa (ao
  // contrário de FecharContaMesaModal/FecharPedidoAvulsoModal, que abrem
  // e fecham por venda). Contador via ref em vez de Date.now(): chamar
  // Date.now() de dentro de uma função do corpo do componente quebra a
  // regra de pureza do React (é sinalizado mesmo só sendo usada num
  // handler, nunca durante o render em si).
  const referenciaPixSeqRef = useRef(0)
  const [referenciaPix, setReferenciaPix] = useState('venda-0')
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false)
  const sacola = useSacola(pedidoEmEdicao?.items)

  // Modo Caixa: carrinho (itens + desconto + total) fica SEMPRE visível —
  // forma de pagamento é uma coluna à parte, que só aparece depois que o
  // operador toca em "Receber pagamento", pra não disputar espaço na tela
  // antes disso nem esconder os itens já lançados.
  const [mostrandoPagamento, setMostrandoPagamento] = useState(false)
  // Código curto só pra essa venda em andamento (referência rápida entre
  // caixa/cliente, e pra diferenciar vendas pausadas na tira) — não é o
  // código oficial do pedido (esse só existe depois de salvo no banco),
  // por isso gerado aqui mesmo, sem chamada nenhuma.
  const [codigoVenda, setCodigoVenda] = useState(() => gerarCodigoVenda())

  // "Pausar venda" — só existe no modo Caixa (finalizarNoAto), pra um
  // operador atender outro cliente sem perder o carrinho em andamento.
  // Persistido no banco (não só memória) pra sobreviver a um refresh da
  // aba — ver vendas_balcao_pausadas.
  const [vendasPausadas, setVendasPausadas] = useState<VendaBalcaoPausada[]>([])
  const [pausandoVenda, setPausandoVenda] = useState(false)
  const [nomeClientePausa, setNomeClientePausa] = useState('')
  const [erroPausar, setErroPausar] = useState<string | null>(null)
  const [enviandoPausa, setEnviandoPausa] = useState(false)
  const [retomandoConflito, setRetomandoConflito] = useState<VendaBalcaoPausada | null>(null)
  const [excluindoPausada, setExcluindoPausada] = useState<VendaBalcaoPausada | null>(null)

  useEffect(() => {
    onSacolaChange?.(sacola.itens.length > 0)
  }, [sacola.itens.length, onSacolaChange])

  useEffect(() => {
    if (!finalizarNoAto || !caixaSessaoId) return
    listarVendasPausadas(caixaSessaoId).then(setVendasPausadas).catch(() => {})
  }, [finalizarNoAto, caixaSessaoId])

  function carregarVendaPausadaNaSacola(p: VendaBalcaoPausada) {
    sacola.substituirItens(p.itens)
    setTipoDesconto(p.tipo_desconto)
    setDescontoInput(p.desconto_input || '')
    setLinhaEmEdicao(null)
    setPixConfirmado(false)
    setMostrandoPagamento(false)
  }

  async function confirmarPausarVenda() {
    if (!caixaSessaoId || sacola.itens.length === 0) return
    setEnviandoPausa(true)
    setErroPausar(null)
    try {
      await pausarVendaNoBanco({
        estabelecimentoId,
        caixaSessaoId,
        nomeCliente: nomeClientePausa,
        itens: sacola.itens,
        tipoDesconto,
        descontoInput,
      })
      setVendasPausadas(await listarVendasPausadas(caixaSessaoId))
      sacola.limparSacola()
      reiniciarVenda()
      setPausandoVenda(false)
      setNomeClientePausa('')
    } catch (err) {
      setErroPausar(err instanceof Error ? err.message : 'Erro ao pausar venda.')
    } finally {
      setEnviandoPausa(false)
    }
  }

  async function retomarVendaPausada(p: VendaBalcaoPausada) {
    if (sacola.itens.length > 0) {
      setRetomandoConflito(p)
      return
    }
    carregarVendaPausadaNaSacola(p)
    try {
      await excluirVendaPausada(p.id)
      setVendasPausadas((prev) => prev.filter((x) => x.id !== p.id))
    } catch {
      // Se a exclusão falhar, a venda retomada continua editável — só fica
      // duplicada na lista de pausadas até recarregar. Não vale travar o
      // atendimento por isso.
    }
  }

  async function confirmarRetomarComConflito() {
    if (!retomandoConflito || !caixaSessaoId) return
    const alvo = retomandoConflito
    setRetomandoConflito(null)
    // Pausa a venda atual (sem nome — o operador não tem tempo de digitar
    // nesse fluxo) antes de carregar a que estava pedindo pra retomar.
    try {
      await pausarVendaNoBanco({
        estabelecimentoId,
        caixaSessaoId,
        nomeCliente: '',
        itens: sacola.itens,
        tipoDesconto,
        descontoInput,
      })
    } catch {
      // Segue mesmo se não conseguiu pausar — melhor perder o rastro da
      // venda atual do que travar o operador no meio do balcão.
    }
    carregarVendaPausadaNaSacola(alvo)
    try {
      await excluirVendaPausada(alvo.id)
    } catch {
      // idem: não trava a retomada por causa disso
    }
    if (caixaSessaoId) setVendasPausadas(await listarVendasPausadas(caixaSessaoId).catch(() => []))
  }

  async function confirmarExcluirPausada() {
    if (!excluindoPausada) return
    const alvo = excluindoPausada
    setExcluindoPausada(null)
    try {
      await excluirVendaPausada(alvo.id)
      setVendasPausadas((prev) => prev.filter((x) => x.id !== alvo.id))
    } catch (err) {
      alert(`Não foi possível excluir: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  function reiniciarVenda() {
    setDescontoInput('')
    setValorRecebido('')
    setLinhaEmEdicao(null)
    setPixConfirmado(false)
    setFormaPagamento('')
    setMostrandoPagamento(false)
    setCodigoVenda(gerarCodigoVenda())
    referenciaPixSeqRef.current += 1
    setReferenciaPix(`venda-${referenciaPixSeqRef.current}`)
  }

  useEffect(() => {
    if (formaPagamento === 'Pix' && !dadosPix) {
      buscarDadosPixEstabelecimento(estabelecimentoId).then(setDadosPix)
    }
  }, [formaPagamento, dadosPix, estabelecimentoId])

  // Reação direta à troca (não um efeito sincronizando com formaPagamento
  // — dispara "cascading renders" no linter).
  function handleFormaPagamentoChange(nova: string) {
    setFormaPagamento(nova)
    if (nova !== 'Pix') setPixConfirmado(false)
  }

  const tipoPedido: TipoPedido = pedidoEmEdicao ? pedidoEmEdicao.tipo_pedido : mesa ? 'mesa' : 'balcao'
  const titulo = pedidoEmEdicao
    ? 'Editar pedido'
    : mesa
      ? `Mesa ${mesa.numero}`
      : finalizarNoAto
        ? 'Nova venda'
        : 'Venda no balcão'

  const descontoNum = calcularDesconto(sacola.total, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const totalComDesconto = Math.max(0, sacola.total - descontoNum)
  const troco = calcularTroco(formaPagamento, valorRecebido, totalComDesconto)
  const trocoInsuficiente = troco !== null && troco < 0

  useEffect(() => {
    listarCardapioParaGarcom(estabelecimentoId)
      .then(setCategorias)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  function executarCancelamento() {
    sacola.limparSacola()
    reiniciarVenda()
    setConfirmandoCancelar(false)
  }

  function cancelarVenda() {
    if (sacola.itens.length > 0) {
      setConfirmandoCancelar(true)
      return
    }
    executarCancelamento()
  }

  async function salvarEdicao() {
    if (!pedidoEmEdicao || sacola.itens.length === 0) return
    setEnviando(true)
    try {
      await atualizarItensPedido(pedidoEmEdicao.id, sacola.itens, sacola.total)
      setEnviando(false)
      onPedidoAtualizado?.()
    } catch (err) {
      setEnviando(false)
      alert(`Não foi possível salvar as alterações: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function lancarPedido() {
    if (sacola.itens.length === 0) return
    if (trocoInsuficiente) return
    if (finalizarNoAto && !formaPagamento) return
    if (finalizarNoAto && formaPagamento === 'Pix' && !pixConfirmado) return
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
          reiniciarVenda()
          onPedidoLancado()
        }, 1500)
        return
      } catch (err) {
        setEnviando(false)
        alert(`Pedido criado, mas não foi possível confirmar o pagamento: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
        sacola.limparSacola()
        reiniciarVenda()
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
        reiniciarVenda()
        onPedidoLancado()
      }, 1800)
    } else {
      sacola.limparSacola()
      reiniciarVenda()
      onPedidoLancado()
    }
  }

  const seletorCardapio = (
    <SeletorCardapioGarcom
      categorias={categorias}
      categoriaAtiva={categoriaAtiva}
      buscaItem={buscaItem}
      estilos={c}
      onBuscaItemChange={setBuscaItem}
      onEscolherCategoria={setCategoriaAtiva}
      onLimparCategoria={() => setCategoriaAtiva(null)}
      onAdicionarItem={sacola.adicionarItem}
    />
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
          <p className={`text-sm font-medium ${c.titulo}`}>Venda registrada — R$ {formatarReais(vendaConfirmada)}</p>
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <VendasPausadasBarra
            pausadas={vendasPausadas}
            onRetomar={retomarVendaPausada}
            onExcluir={setExcluindoPausada}
            estilos={c}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:h-full sm:flex-row sm:overflow-hidden">
          <div className={`order-1 min-h-0 flex-1 overflow-y-auto p-4 sm:order-1 sm:h-full ${c.fundoCardapio}`}>
            {seletorCardapio}
          </div>

          {/* Carrinho — sempre visível, itens nunca somem da tela mesmo
              depois de "Receber pagamento" (só a coluna de pagamento se
              soma ao lado, não substitui isso aqui). */}
          <div
            className={`order-2 flex min-h-0 flex-col gap-3 border-t p-4 sm:order-2 sm:h-full sm:w-72 sm:flex-shrink-0 sm:border-l sm:border-r-0 sm:border-t-0 ${c.borda} ${c.modal}`}
          >
            <p className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${c.label}`}>🧾 Venda #{codigoVenda}</p>

            {sacola.itens.length === 0 ? (
              <p className={`text-sm ${c.vazio}`}>Toque num item do cardápio pra adicionar.</p>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto text-sm">
                  {sacola.itens.map((item) => {
                    const linhaId = item.linhaId || item.id
                    return (
                      <LinhaCarrinhoGarcom
                        key={linhaId}
                        item={item}
                        editando={linhaEmEdicao === linhaId}
                        onToggleEditar={() => setLinhaEmEdicao(linhaEmEdicao === linhaId ? null : linhaId)}
                        onAlterarQuantidade={(delta) => sacola.alterarQuantidade(linhaId, delta)}
                        onRemover={() => { sacola.removerItem(linhaId); setLinhaEmEdicao(null) }}
                        estilos={c}
                      />
                    )
                  })}
                </div>

                {/* Desconto é dado da venda, não do pagamento em si — fica
                    junto do carrinho, editável o tempo todo. */}
                <div className="shrink-0">
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

                <div className={`shrink-0 space-y-1 border-t pt-2 text-sm ${c.borda}`}>
                  <div className={`flex justify-between ${c.label}`}>
                    <span>Subtotal</span>
                    <span>R$ {formatarReais(sacola.total)}</span>
                  </div>
                  {descontoNum > 0 && (
                    <div className={`flex justify-between ${c.label}`}>
                      <span>Desconto</span>
                      <span>− R$ {formatarReais(descontoNum)}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-base font-bold ${c.total}`}>
                    <span>Total</span>
                    <span>R$ {formatarReais(totalComDesconto)}</span>
                  </div>
                </div>

                <div className="shrink-0 flex gap-2">
                  <button
                    onClick={cancelarVenda}
                    disabled={enviando}
                    title="F2 — Cancelar"
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${c.borda} ${c.label} ${
                      tema === 'escuro' ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'
                    }`}
                  >
                    Cancelar
                  </button>
                  {caixaSessaoId && (
                    <button
                      onClick={() => setPausandoVenda(true)}
                      disabled={enviando}
                      title="Pausar essa venda e atender outro cliente"
                      className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      ⏸ Pausar
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setMostrandoPagamento((v) => !v)}
                  className={`shrink-0 rounded-lg py-3 text-base font-bold transition ${
                    mostrandoPagamento
                      ? `border ${c.borda} ${c.label} ${tema === 'escuro' ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`
                      : c.botaoPrincipal
                  }`}
                >
                  {mostrandoPagamento ? '← Voltar ao carrinho' : 'Receber pagamento →'}
                </button>
              </>
            )}
          </div>

          {/* Pagamento — só existe depois que o operador decide encerrar a
              venda, então nunca disputa espaço com o carrinho enquanto ele
              ainda está montando o pedido. */}
          {mostrandoPagamento && sacola.itens.length > 0 && (
            <div
              className={`order-3 flex min-h-0 flex-col gap-3 border-t p-4 sm:order-3 sm:h-full sm:w-72 sm:flex-shrink-0 sm:border-l sm:border-r-0 sm:border-t-0 ${c.borda} ${c.modal}`}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PainelPagamentoGarcom
                  totalComDesconto={totalComDesconto}
                  descontoNum={descontoNum}
                  formaPagamento={formaPagamento}
                  onFormaPagamentoChange={handleFormaPagamentoChange}
                  valorRecebido={valorRecebido}
                  onValorRecebidoChange={setValorRecebido}
                  tema={tema}
                  dadosPix={dadosPix}
                  referenciaPix={referenciaPix}
                  pixConfirmado={pixConfirmado}
                  onPixConfirmadoChange={setPixConfirmado}
                  trocoInsuficiente={trocoInsuficiente}
                  estilos={c}
                />
              </div>
              <button
                onClick={lancarPedido}
                disabled={enviando || trocoInsuficiente || !formaPagamento || (formaPagamento === 'Pix' && !pixConfirmado)}
                title="F10 — Pagamento / Finalizar"
                className={`shrink-0 rounded-lg py-3 text-base font-bold transition disabled:opacity-50 ${c.botaoPrincipal}`}
              >
                {enviando
                  ? 'Confirmando...'
                  : formaPagamento
                    ? `Confirmar venda — R$ ${formatarReais(totalComDesconto)}`
                    : 'Escolha a forma de pagamento'}
              </button>
            </div>
          )}
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{seletorCardapio}</div>

          {sacola.itens.length > 0 && (
            <div className={`border-t ${c.borda} p-4`}>
              <div className="mb-3 max-h-32 space-y-1 overflow-y-auto text-sm">
                {sacola.itens.map((item) => {
                  const linhaId = item.linhaId || item.id
                  return (
                    <LinhaCarrinhoGarcom
                      key={linhaId}
                      item={item}
                      editando={linhaEmEdicao === linhaId}
                      onToggleEditar={() => setLinhaEmEdicao(linhaEmEdicao === linhaId ? null : linhaId)}
                      onAlterarQuantidade={(delta) => sacola.alterarQuantidade(linhaId, delta)}
                      onRemover={() => { sacola.removerItem(linhaId); setLinhaEmEdicao(null) }}
                      estilos={c}
                    />
                  )
                })}
              </div>

              <div className={`mb-3 flex justify-between text-base font-bold ${c.total}`}>
                <span>Total</span>
                <span>R$ {formatarReais(sacola.total)}</span>
              </div>
              <button
                onClick={pedidoEmEdicao ? salvarEdicao : lancarPedido}
                disabled={enviando}
                className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${c.botaoPrincipal}`}
              >
                {enviando
                  ? pedidoEmEdicao ? 'Salvando...' : 'Lançando...'
                  : pedidoEmEdicao
                    ? 'Salvar alterações'
                    : mesa
                      ? `Lançar pedido — Mesa ${mesa.numero}`
                      : 'Lançar venda no balcão'}
              </button>
            </div>
          )}
        </>
      )}

      {confirmandoCancelar && (
        <ConfirmarAcaoModal
          titulo="Cancelar venda?"
          descricao="Cancelar essa venda e limpar os itens já lançados?"
          confirmarLabel="Cancelar venda"
          tom="perigo"
          onCancelar={() => setConfirmandoCancelar(false)}
          onConfirmar={executarCancelamento}
        />
      )}

      {pausandoVenda && (
        <ConfirmarAcaoModal
          titulo="Pausar venda"
          confirmarLabel="Pausar"
          enviando={enviandoPausa}
          onCancelar={() => { setPausandoVenda(false); setErroPausar(null) }}
          onConfirmar={confirmarPausarVenda}
          descricao={
            <div className="space-y-2">
              <p>O carrinho atual fica guardado — pode retomar depois na tira de vendas pausadas.</p>
              <input
                type="text"
                autoFocus
                value={nomeClientePausa}
                onChange={(e) => setNomeClientePausa(e.target.value)}
                placeholder="Nome do cliente (opcional)"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
              />
              {erroPausar && <p className="text-sm text-red-600">{erroPausar}</p>}
            </div>
          }
        />
      )}

      {retomandoConflito && (
        <ConfirmarAcaoModal
          titulo="Pausar a venda atual e retomar esta?"
          descricao="Há uma venda em andamento no carrinho. Ela será pausada automaticamente pra dar lugar à venda que você quer retomar."
          tom="atencao"
          confirmarLabel="Pausar e retomar"
          onCancelar={() => setRetomandoConflito(null)}
          onConfirmar={confirmarRetomarComConflito}
        />
      )}

      {excluindoPausada && (
        <ConfirmarAcaoModal
          titulo="Descartar venda pausada?"
          descricao={`Os itens de "${excluindoPausada.nome_cliente || 'venda sem nome'}" serão perdidos.`}
          tom="perigo"
          confirmarLabel="Descartar"
          onCancelar={() => setExcluindoPausada(null)}
          onConfirmar={confirmarExcluirPausada}
        />
      )}
    </>
  )

  if (modo === 'inline') {
    // Altura limitada (não só mínima) — sem isso o cardápio e a lista de
    // itens da venda cresciam junto com o conteúdo em vez de rolar dentro
    // do próprio espaço, e o botão "Confirmar venda" (que fica abaixo da
    // lista de itens, dentro dessa mesma coluna) podia acabar fora da
    // tela, exigindo rolar a página inteira do Caixa pra confirmar.
    return (
      <div className={`flex h-[75vh] min-h-[520px] flex-col rounded-xl border ${c.borda} ${c.modal}`}>{corpo}</div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`relative flex max-h-[85vh] w-full flex-col rounded-t-2xl ${c.modal} shadow-2xl sm:rounded-2xl ${
          finalizarNoAto ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        {corpo}
      </div>
    </div>
  )
}
