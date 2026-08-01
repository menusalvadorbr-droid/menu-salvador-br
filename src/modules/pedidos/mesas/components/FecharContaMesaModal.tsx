'use client'

import { useState } from 'react'
import { useFecharContaMesa } from '../hooks/useFecharContaMesa'
import { ETIQUETA_STATUS } from '../../types'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import type { Mesa } from '../types'

const METODOS_PAGAMENTO = ['Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Pix']

// Compartilhado com o resto do mapa de mesas (tema="claro", padrão — não
// mexe no visual de lá). Aberto a partir da área de Caixa, que foi
// redesenhada com um visual escuro tipo PDV desacoplado do resto do
// painel, entra com tema="escuro" — mesmo componente, duas peles.
const ESTILOS = {
  claro: {
    overlay: 'bg-black/40',
    modal: 'bg-white',
    borda: 'border-neutral-100',
    titulo: 'text-neutral-900',
    fechar: 'text-neutral-400 hover:text-neutral-600',
    vazio: 'text-neutral-400',
    cardPedido: 'border-neutral-100',
    nomeCliente: 'text-neutral-900',
    statusPedido: 'text-neutral-400',
    itemTexto: 'text-neutral-600',
    totalPedido: 'text-neutral-900',
    erro: 'bg-red-50 text-red-700',
    labelTotal: 'text-neutral-500',
    totalPago: 'text-green-600',
    faltaPagar: 'text-neutral-900',
    label: 'text-neutral-600',
    input: 'border-neutral-200 bg-white text-neutral-900',
    botaoVerde: 'bg-green-600 hover:bg-green-700 text-white',
    separador: 'bg-neutral-100',
    separadorTexto: 'text-neutral-400',
    botaoNeutro: 'bg-neutral-800 hover:bg-neutral-700 text-white',
  },
  escuro: {
    overlay: 'bg-black/60',
    modal: 'bg-neutral-900',
    borda: 'border-neutral-800',
    titulo: 'text-white',
    fechar: 'text-neutral-500 hover:text-neutral-300',
    vazio: 'text-neutral-500',
    cardPedido: 'border-neutral-800',
    nomeCliente: 'text-white',
    statusPedido: 'text-neutral-500',
    itemTexto: 'text-neutral-400',
    totalPedido: 'text-white',
    erro: 'border border-red-500/30 bg-red-500/10 text-red-400',
    labelTotal: 'text-neutral-500',
    totalPago: 'text-emerald-400',
    faltaPagar: 'text-white',
    label: 'text-neutral-400',
    input: 'border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-500',
    botaoVerde: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    separador: 'bg-neutral-800',
    separadorTexto: 'text-neutral-500',
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
  const [formaPagamento, setFormaPagamento] = useState(METODOS_PAGAMENTO[0])
  const [nomePagador, setNomePagador] = useState('')
  const [valorParcial, setValorParcial] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')

  const totalPago = total - saldo
  const descontoNum = calcularDesconto(saldo, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const valorACobrar = Math.max(0, saldo - descontoNum)

  async function handleRegistrar(valor: number) {
    const resultado = await registrarPagamento(valor, formaPagamento, nomePagador)
    if (resultado.contaFechada) {
      onContaFechada()
    } else if (resultado.ok) {
      setValorParcial('')
      setNomePagador('')
    }
  }

  async function handleFecharTudo() {
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
                        <span className="flex-shrink-0">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-1 text-right text-sm font-semibold ${c.totalPedido}`}>R$ {pedido.total.toFixed(2)}</p>
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

              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${c.labelTotal}`}>
                  <span>Total da mesa</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                {totalPago > 0 && (
                  <div className={`flex justify-between ${c.totalPago}`}>
                    <span>Já pago</span>
                    <span>R$ {totalPago.toFixed(2)}</span>
                  </div>
                )}
                <div className={`flex justify-between text-base font-bold ${c.faltaPagar}`}>
                  <span>Falta pagar</span>
                  <span>R$ {Math.max(0, saldo).toFixed(2)}</span>
                </div>
              </div>

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
                {descontoNum > 0 && (
                  <p className={`mt-1 text-xs ${c.totalPago}`}>
                    Desconto de R$ {descontoNum.toFixed(2)} — total a cobrar: R$ {valorACobrar.toFixed(2)}
                  </p>
                )}
              </div>

              <button
                onClick={handleFecharTudo}
                disabled={enviando || !caixaAberto}
                className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${c.botaoVerde}`}
              >
                {enviando ? 'Processando...' : `Fechar tudo agora — R$ ${valorACobrar.toFixed(2)}`}
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
