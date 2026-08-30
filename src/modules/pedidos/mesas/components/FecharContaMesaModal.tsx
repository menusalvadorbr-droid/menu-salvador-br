'use client'

import { useEffect, useState } from 'react'
import { useFecharContaMesa } from '../hooks/useFecharContaMesa'
import { ETIQUETA_STATUS } from '../../types'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import { formatarReais } from '@/lib/moeda'
import SeletorFormaPagamento, { METODOS_PAGAMENTO, calcularTroco } from '../../components/SeletorFormaPagamento'
import PainelPixCobranca from '../../components/PainelPixCobranca'
import { buscarDadosPixEstabelecimento, type DadosPixEstabelecimento } from '@/lib/pix/buscarDadosPixEstabelecimento'
import { TEMA_DUAS_PELES } from '../../temaDuasPeles'
import type { Mesa } from '../types'

// Compartilhado com o resto do mapa de mesas (tema="claro", padrão — não
// mexe no visual de lá). A área de Caixa também usa claro desde que sua
// paleta foi unificada com o resto do painel — `escuro` segue existindo
// como opção reutilizável, sem consumidor no momento.
const ESTILOS = {
  claro: {
    ...TEMA_DUAS_PELES.claro,
    overlay: 'bg-black/40',
    cardPedido: 'border-neutral-100',
    nomeCliente: 'text-neutral-900',
    statusPedido: 'text-neutral-400',
    itemTexto: 'text-neutral-600',
    totalPedido: 'text-neutral-900',
    erro: 'bg-red-50 text-red-700',
    labelTotal: 'text-neutral-500',
    totalPago: 'text-green-600',
    faltaPagar: 'text-neutral-900',
    botaoVerde: 'bg-green-600 hover:bg-green-700 text-white',
    botaoNeutro: 'bg-neutral-800 hover:bg-neutral-700 text-white',
  },
  escuro: {
    ...TEMA_DUAS_PELES.escuro,
    overlay: 'bg-black/60',
    cardPedido: 'border-neutral-800',
    nomeCliente: 'text-white',
    statusPedido: 'text-neutral-500',
    itemTexto: 'text-neutral-400',
    totalPedido: 'text-white',
    erro: 'border border-red-500/30 bg-red-500/10 text-red-400',
    labelTotal: 'text-neutral-500',
    totalPago: 'text-emerald-400',
    faltaPagar: 'text-white',
    botaoVerde: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    botaoNeutro: 'border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100',
  },
} as const

export default function FecharContaMesaModal({
  estabelecimentoId,
  mesa,
  onFechar,
  onContaFechada,
  tema = 'claro',
}: {
  estabelecimentoId: string
  mesa: Mesa
  onFechar: () => void
  onContaFechada: () => void
  tema?: 'claro' | 'escuro'
}) {
  const c = ESTILOS[tema]
  const { pedidos, total, saldo, carregando, enviando, erro, caixaAberto, registrarPagamento, fecharTudo } =
    useFecharContaMesa(mesa, estabelecimentoId)
  const [formaPagamento, setFormaPagamento] = useState<string>(METODOS_PAGAMENTO[0])
  const [valorRecebido, setValorRecebido] = useState('')
  const [nomePagador, setNomePagador] = useState('')
  const [valorParcial, setValorParcial] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')
  const [dadosPix, setDadosPix] = useState<DadosPixEstabelecimento | null>(null)
  const [pixConfirmado, setPixConfirmado] = useState(false)
  // Referência do BR Code fixa pra esse fechamento — gerada uma vez, não a
  // cada render (senão o QR mudaria sozinho enquanto o operador olha pra
  // ele). É o fechamento de uma mesa inteira, não de um pedido só, então
  // não existe um codigo_pedido único pra reaproveitar aqui.
  const [referenciaPix] = useState(() => `mesa-${mesa.numero}-${Date.now()}`)

  useEffect(() => {
    if (formaPagamento === 'Pix' && !dadosPix) {
      buscarDadosPixEstabelecimento(estabelecimentoId).then(setDadosPix)
    }
  }, [formaPagamento, dadosPix, estabelecimentoId])

  // Reseta a confirmação ao trocar de forma de pagamento (não num efeito
  // separado sincronizando com formaPagamento — isso dispara "cascading
  // renders" no linter; aqui é reação direta à ação de trocar, não uma
  // derivação de estado).
  function handleFormaPagamentoChange(nova: string) {
    setFormaPagamento(nova)
    if (nova !== 'Pix') setPixConfirmado(false)
  }

  const totalPago = total - saldo
  const descontoNum = calcularDesconto(saldo, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const valorACobrar = Math.max(0, saldo - descontoNum)
  const troco = calcularTroco(formaPagamento, valorRecebido, valorACobrar)
  const trocoInsuficiente = troco !== null && troco < 0

  async function handleRegistrar(valor: number) {
    const resultado = await registrarPagamento(valor, formaPagamento, nomePagador)
    if (resultado.contaFechada) {
      onContaFechada()
    } else if (resultado.ok) {
      setValorParcial('')
      setNomePagador('')
      setValorRecebido('')
    }
  }

  async function handleFecharTudo() {
    if (trocoInsuficiente || (formaPagamento === 'Pix' && !pixConfirmado)) return
    const resultado = await fecharTudo(formaPagamento, nomePagador, descontoNum)
    if (resultado.ok) onContaFechada()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className={`absolute inset-0 ${c.overlay}`} onClick={onFechar} />
      <div className={`relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl ${c.modal} shadow-2xl sm:rounded-2xl`}>
        <div className={`flex items-center justify-between border-b ${c.borda} p-4`}>
          <h2 className={`text-lg font-bold ${c.titulo}`}>💳 Fechar conta — Mesa {mesa.numero}</h2>
          <button onClick={onFechar} className={c.fechar}>✕</button>
        </div>

        {carregando ? (
          <div className={`flex flex-1 items-center justify-center p-8 ${c.vazio}`}>Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className={`flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center ${c.vazio}`}>
            <span className="text-3xl">✅</span>
            Nenhum pedido em aberto nessa mesa.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className={`rounded-xl border ${c.cardPedido} p-3`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${c.nomeCliente}`}>{pedido.nome_cliente || 'Cliente'}</p>
                    <span className={`text-xs ${c.statusPedido}`}>{ETIQUETA_STATUS[pedido.status]}</span>
                  </div>
                  <ul className={`mt-1 space-y-0.5 text-xs ${c.itemTexto}`}>
                    {pedido.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <span>{item.quantidade}x {item.nome}</span>
                        <span className="flex-shrink-0">R$ {formatarReais(item.preco * item.quantidade)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-1 text-right text-sm font-semibold ${c.totalPedido}`}>R$ {formatarReais(pedido.total)}</p>
                </div>
              ))}
            </div>

            <div className={`space-y-3 border-t ${c.borda} p-4`}>
              {!caixaAberto && (
                <p className={`rounded-lg px-3 py-2 text-sm ${c.erro}`}>
                  ⚠️ Caixa fechado — abra o caixa antes de fechar a conta dessa mesa. Sem uma sessão aberta, o
                  pagamento não fica registrado em nenhum turno.
                </p>
              )}
              {erro && <p className={`rounded-lg px-3 py-2 text-sm ${c.erro}`}>{erro}</p>}

              <div>
                <label className={`mb-1 block text-xs font-medium ${c.label}`}>
                  Nome de quem pagou <span className="font-normal opacity-70">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nomePagador}
                  onChange={(e) => setNomePagador(e.target.value)}
                  placeholder="Ex: Paulo"
                  className={`w-full rounded-lg border px-3 py-2 ${c.input}`}
                />
              </div>

              <SeletorFormaPagamento
                formaPagamento={formaPagamento}
                onChangeFormaPagamento={handleFormaPagamentoChange}
                valorRecebido={valorRecebido}
                onChangeValorRecebido={setValorRecebido}
                total={valorACobrar}
                tema={tema}
              />

              {formaPagamento === 'Pix' && (
                <>
                  <PainelPixCobranca
                    chavePix={dadosPix?.chavePix ?? null}
                    nomeFantasia={dadosPix?.nomeFantasia ?? ''}
                    cidade={dadosPix?.cidade ?? null}
                    valor={valorACobrar}
                    referencia={referenciaPix}
                    tema={tema}
                  />
                  <label className={`flex items-center gap-2 text-sm ${c.label}`}>
                    <input
                      type="checkbox"
                      checked={pixConfirmado}
                      onChange={(e) => setPixConfirmado(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Confirmei que o Pix caiu
                  </label>
                </>
              )}

              <div>
                <label className={`mb-1 block text-xs font-medium ${c.label}`}>
                  Desconto <span className="font-normal opacity-70">(opcional, aplica no fechar tudo agora)</span>
                </label>
                <div className="flex gap-2">
                  <div className={`flex overflow-hidden rounded-lg border ${c.borda}`}>
                    <button
                      type="button"
                      onClick={() => setTipoDesconto('valor')}
                      className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'valor' ? c.botaoVerde : c.label}`}
                    >
                      R$
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoDesconto('percentual')}
                      className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'percentual' ? c.botaoVerde : c.label}`}
                    >
                      %
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={descontoInput}
                    onChange={(e) => setDescontoInput(e.target.value)}
                    placeholder={tipoDesconto === 'percentual' ? 'Ex: 10' : 'Ex: 20,00'}
                    className={`flex-1 rounded-lg border px-3 py-2 ${c.input}`}
                  />
                </div>
              </div>

              <div className={`space-y-1 border-t pt-3 text-sm ${c.borda}`}>
                <div className={`flex justify-between ${c.labelTotal}`}>
                  <span>Total da mesa</span>
                  <span>R$ {formatarReais(total)}</span>
                </div>
                {totalPago > 0 && (
                  <div className={`flex justify-between ${c.totalPago}`}>
                    <span>Já pago</span>
                    <span>R$ {formatarReais(totalPago)}</span>
                  </div>
                )}
                <div className={`flex justify-between ${c.labelTotal}`}>
                  <span>Subtotal a cobrar</span>
                  <span>R$ {formatarReais(Math.max(0, saldo))}</span>
                </div>
                {descontoNum > 0 && (
                  <div className={`flex justify-between ${c.labelTotal}`}>
                    <span>Desconto</span>
                    <span>− R$ {formatarReais(descontoNum)}</span>
                  </div>
                )}
                <div className={`flex justify-between text-base font-bold ${c.faltaPagar}`}>
                  <span>Total a cobrar</span>
                  <span>R$ {formatarReais(valorACobrar)}</span>
                </div>
              </div>

              {trocoInsuficiente && (
                <p className="text-xs font-medium text-red-500">Valor recebido menor que o total — confira antes de fechar.</p>
              )}

              <button
                onClick={handleFecharTudo}
                disabled={enviando || !caixaAberto || trocoInsuficiente || (formaPagamento === 'Pix' && !pixConfirmado)}
                title="F10 — Pagamento / Finalizar"
                className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${c.botaoVerde}`}
              >
                {enviando ? 'Processando...' : `Fechar tudo agora — R$ ${formatarReais(valorACobrar)}`}
              </button>

              <div className={`flex items-center gap-2 text-xs ${c.separadorTexto}`}>
                <div className={`h-px flex-1 ${c.separador}`} />
                ou registrar pagamento parcial
                <div className={`h-px flex-1 ${c.separador}`} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorParcial}
                  onChange={(e) => setValorParcial(e.target.value)}
                  placeholder="Ex: 50,00"
                  className={`flex-1 rounded-lg border px-3 py-2 ${c.input}`}
                />
                <button
                  onClick={() => handleRegistrar(parseFloat(valorParcial.replace(',', '.')) || 0)}
                  disabled={enviando || !valorParcial.trim() || !caixaAberto}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${c.botaoNeutro}`}
                >
                  Registrar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
