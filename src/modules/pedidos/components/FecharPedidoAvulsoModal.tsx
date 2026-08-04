'use client'

import { useState } from 'react'
import { calcularDesconto, type TipoDesconto } from '@/lib/desconto'
import { finalizarVendaImediata } from '../ordersRepository'
import { vincularPedidoASessaoAberta } from '@/modules/financeiro/caixaRepository'
import SeletorFormaPagamento, { calcularTroco } from './SeletorFormaPagamento'
import { ETIQUETA_TIPO_PEDIDO, type Pedido } from '../types'

// Mesmo princípio de tema do FecharContaMesaModal — claro é o padrão
// (nenhum outro lugar do painel abre esse modal fora do Caixa hoje, mas
// segue a mesma convenção do resto da área de pagamento por consistência).
const ESTILOS = {
  claro: {
    overlay: 'bg-black/40',
    modal: 'bg-white',
    borda: 'border-neutral-100',
    titulo: 'text-neutral-900',
    fechar: 'text-neutral-400 hover:text-neutral-600',
    itemTexto: 'text-neutral-600',
    erro: 'bg-red-50 text-red-700',
    labelTotal: 'text-neutral-500',
    faltaPagar: 'text-neutral-900',
    botaoVerde: 'bg-green-600 hover:bg-green-700 text-white',
  },
  escuro: {
    overlay: 'bg-black/60',
    modal: 'bg-neutral-900',
    borda: 'border-neutral-800',
    titulo: 'text-white',
    fechar: 'text-neutral-500 hover:text-neutral-300',
    itemTexto: 'text-neutral-400',
    erro: 'border border-red-500/30 bg-red-500/10 text-red-400',
    labelTotal: 'text-neutral-500',
    faltaPagar: 'text-white',
    botaoVerde: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
} as const

/**
 * Fecha um pedido avulso (balcão/retirada/entrega, sem mesa) que já chegou
 * em "entregue" — a mesma captura de forma de pagamento/desconto/troco do
 * fechamento de mesa, só que pra um pedido só em vez de somar vários.
 * Substitui o antigo "marcar como pago" direto do quadro de comandas, que
 * pulava essa etapa inteira.
 */
export default function FecharPedidoAvulsoModal({
  estabelecimentoId,
  pedido,
  caixaAberto,
  onFechar,
  onContaFechada,
  tema = 'claro',
}: {
  estabelecimentoId: string
  pedido: Pedido
  caixaAberto: boolean
  onFechar: () => void
  onContaFechada: () => void
  tema?: 'claro' | 'escuro'
}) {
  const c = ESTILOS[tema]
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorRecebido, setValorRecebido] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState<TipoDesconto>('valor')
  const [descontoInput, setDescontoInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const descontoNum = calcularDesconto(pedido.total, tipoDesconto, parseFloat(descontoInput.replace(',', '.')) || 0)
  const totalACobrar = Math.max(0, pedido.total - descontoNum)
  const troco = calcularTroco(formaPagamento, valorRecebido, totalACobrar)
  const trocoInsuficiente = troco !== null && troco < 0

  async function handleFechar() {
    if (!caixaAberto || trocoInsuficiente || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await finalizarVendaImediata(pedido.id, totalACobrar, descontoNum, formaPagamento)
      try {
        await vincularPedidoASessaoAberta(estabelecimentoId, pedido.id)
      } catch {
        // Sem caixa aberto não deve travar — já checamos acima, mas por
        // segurança não deixa um erro aqui derrubar um pagamento que já
        // foi gravado com sucesso.
      }
      onContaFechada()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fechar o pedido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className={`absolute inset-0 ${c.overlay}`} onClick={onFechar} />
      <div className={`relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl ${c.modal} shadow-2xl sm:rounded-2xl`}>
        <div className={`flex items-center justify-between border-b ${c.borda} p-4`}>
          <h2 className={`text-lg font-bold ${c.titulo}`}>
            💳 Fechar conta — {ETIQUETA_TIPO_PEDIDO[pedido.tipo_pedido]}
            {pedido.nome_cliente ? ` · ${pedido.nome_cliente}` : ''}
          </h2>
          <button onClick={onFechar} className={c.fechar}>✕</button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className={`rounded-xl border ${c.borda} p-3`}>
            <ul className={`space-y-0.5 text-xs ${c.itemTexto}`}>
              {pedido.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span>{item.quantidade}x {item.nome}</span>
                  <span className="flex-shrink-0">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`space-y-3 border-t ${c.borda} p-4`}>
          {!caixaAberto && (
            <p className={`rounded-lg px-3 py-2 text-sm ${c.erro}`}>
              ⚠️ Caixa fechado — abra o caixa antes de fechar essa conta. Sem uma sessão aberta, o pagamento
              não fica registrado em nenhum turno.
            </p>
          )}
          {erro && <p className={`rounded-lg px-3 py-2 text-sm ${c.erro}`}>{erro}</p>}

          <SeletorFormaPagamento
            formaPagamento={formaPagamento}
            onChangeFormaPagamento={setFormaPagamento}
            valorRecebido={valorRecebido}
            onChangeValorRecebido={setValorRecebido}
            total={totalACobrar}
            tema={tema}
          />

          <div>
            <label className={`mb-1 block text-xs font-medium ${c.labelTotal}`}>
              Desconto <span className="font-normal opacity-70">(opcional)</span>
            </label>
            <div className="flex gap-2">
              <div className={`flex overflow-hidden rounded-lg border ${c.borda}`}>
                <button
                  type="button"
                  onClick={() => setTipoDesconto('valor')}
                  className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'valor' ? c.botaoVerde : c.labelTotal}`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDesconto('percentual')}
                  className={`px-3 py-2 text-sm font-medium transition ${tipoDesconto === 'percentual' ? c.botaoVerde : c.labelTotal}`}
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
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  tema === 'escuro'
                    ? 'border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-500'
                    : 'border-neutral-200 bg-white text-neutral-900'
                }`}
              />
            </div>
          </div>

          <div className={`space-y-1 border-t pt-3 text-sm ${c.borda}`}>
            <div className={`flex justify-between ${c.labelTotal}`}>
              <span>Subtotal</span>
              <span>R$ {pedido.total.toFixed(2)}</span>
            </div>
            {descontoNum > 0 && (
              <div className={`flex justify-between ${c.labelTotal}`}>
                <span>Desconto</span>
                <span>− R$ {descontoNum.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between text-base font-bold ${c.faltaPagar}`}>
              <span>Total a cobrar</span>
              <span>R$ {totalACobrar.toFixed(2)}</span>
            </div>
          </div>

          {trocoInsuficiente && (
            <p className="text-xs font-medium text-red-500">Valor recebido menor que o total — confira antes de fechar.</p>
          )}

          <button
            onClick={handleFechar}
            disabled={enviando || !caixaAberto || trocoInsuficiente}
            className={`w-full rounded-lg py-2.5 font-semibold transition disabled:opacity-50 ${c.botaoVerde}`}
          >
            {enviando ? 'Processando...' : `Fechar conta — R$ ${totalACobrar.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
