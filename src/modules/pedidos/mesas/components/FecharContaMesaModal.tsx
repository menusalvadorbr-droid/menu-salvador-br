'use client'

import { useState } from 'react'
import { useFecharContaMesa } from '../hooks/useFecharContaMesa'
import { ETIQUETA_STATUS } from '../../types'
import type { Mesa } from '../types'

const METODOS_PAGAMENTO = ['Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Pix']

export default function FecharContaMesaModal({
  estabelecimentoId,
  mesa,
  onFechar,
  onContaFechada,
}: {
  estabelecimentoId: string
  mesa: Mesa
  onFechar: () => void
  onContaFechada: () => void
}) {
  const { pedidos, total, saldo, carregando, enviando, erro, registrarPagamento } = useFecharContaMesa(
    mesa,
    estabelecimentoId
  )
  const [formaPagamento, setFormaPagamento] = useState(METODOS_PAGAMENTO[0])
  const [nomePagador, setNomePagador] = useState('')
  const [valorParcial, setValorParcial] = useState('')

  const totalPago = total - saldo

  async function handleRegistrar(valor: number) {
    const resultado = await registrarPagamento(valor, formaPagamento, nomePagador)
    if (resultado.contaFechada) {
      onContaFechada()
    } else if (resultado.ok) {
      setValorParcial('')
      setNomePagador('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 p-4">
          <h2 className="text-lg font-bold text-neutral-900">💳 Fechar conta — Mesa {mesa.numero}</h2>
          <button onClick={onFechar} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        {carregando ? (
          <div className="flex flex-1 items-center justify-center p-8 text-neutral-400">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-neutral-400">
            <span className="text-3xl">✅</span>
            Nenhum pedido em aberto nessa mesa.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="rounded-xl border border-neutral-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-900">{pedido.nome_cliente || 'Cliente'}</p>
                    <span className="text-xs text-neutral-400">{ETIQUETA_STATUS[pedido.status]}</span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                    {pedido.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3">
                        <span>{item.quantidade}x {item.nome}</span>
                        <span className="flex-shrink-0">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-right text-sm font-semibold text-neutral-900">R$ {pedido.total.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-neutral-100 p-4">
              {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Total da mesa</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                {totalPago > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Já pago</span>
                    <span>R$ {totalPago.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-neutral-900">
                  <span>Falta pagar</span>
                  <span>R$ {Math.max(0, saldo).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">
                  Nome de quem pagou <span className="font-normal text-neutral-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nomePagador}
                  onChange={(e) => setNomePagador(e.target.value)}
                  placeholder="Ex: Paulo"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Forma de pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
                >
                  {METODOS_PAGAMENTO.map((metodo) => (
                    <option key={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleRegistrar(saldo)}
                disabled={enviando}
                className="w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {enviando ? 'Processando...' : `Fechar tudo agora — R$ ${Math.max(0, saldo).toFixed(2)}`}
              </button>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="h-px flex-1 bg-neutral-100" />
                ou registrar pagamento parcial
                <div className="h-px flex-1 bg-neutral-100" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorParcial}
                  onChange={(e) => setValorParcial(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
                />
                <button
                  onClick={() => handleRegistrar(parseFloat(valorParcial.replace(',', '.')) || 0)}
                  disabled={enviando || !valorParcial.trim()}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
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
