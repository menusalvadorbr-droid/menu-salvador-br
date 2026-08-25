'use client'

import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import { METODOS_PAGAMENTO } from '../metodosPagamento'

export { METODOS_PAGAMENTO }

const ICONE_METODO: Record<(typeof METODOS_PAGAMENTO)[number], typeof Banknote> = {
  'Dinheiro': Banknote,
  'Cartão de débito': CreditCard,
  'Cartão de crédito': CreditCard,
  'Pix': Smartphone,
}

const ESTILOS = {
  claro: {
    tile: 'border-neutral-200 text-neutral-600 hover:border-neutral-300',
    tileAtivo: 'border-orange-500 bg-orange-50 text-orange-700',
    label: 'text-neutral-600',
    input: 'border-neutral-200 bg-white text-neutral-900',
    trocoOk: 'text-green-600',
    trocoFalta: 'text-red-600',
  },
  escuro: {
    tile: 'border-neutral-700 text-neutral-400 hover:border-neutral-600',
    tileAtivo: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    label: 'text-neutral-400',
    input: 'border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-500',
    trocoOk: 'text-emerald-400',
    trocoFalta: 'text-red-400',
  },
} as const

/**
 * Quanto falta pra cobrir o total, se a forma de pagamento for Dinheiro e o
 * caixa tiver preenchido o valor recebido — `null` quando não se aplica
 * (outra forma de pagamento, ou campo ainda vazio), pra quem for usar isso
 * só pra decidir se trava o botão de confirmar não precisar reimplementar
 * esse parse em cada tela.
 */
export function calcularTroco(formaPagamento: string, valorRecebido: string, total: number): number | null {
  if (formaPagamento !== 'Dinheiro' || !valorRecebido.trim()) return null
  const valorRecebidoNum = parseFloat(valorRecebido.replace(',', '.')) || 0
  return valorRecebidoNum - total
}

/**
 * Seletor de forma de pagamento em blocos grandes (em vez de um <select>)
 * — mais rápido de bater o olho e tocar num terminal de caixa — com
 * calculadora de troco quando "Dinheiro" é escolhido. Usado tanto na Nova
 * venda do Caixa quanto no fechamento de conta de mesa, pra não duplicar
 * essa UI (e a lista de métodos) nos dois lugares.
 */
export default function SeletorFormaPagamento({
  formaPagamento,
  onChangeFormaPagamento,
  valorRecebido,
  onChangeValorRecebido,
  total,
  tema = 'claro',
}: {
  formaPagamento: string
  onChangeFormaPagamento: (metodo: string) => void
  valorRecebido: string
  onChangeValorRecebido: (valor: string) => void
  total: number
  tema?: 'claro' | 'escuro'
}) {
  const c = ESTILOS[tema]
  const ehDinheiro = formaPagamento === 'Dinheiro'
  const troco = calcularTroco(formaPagamento, valorRecebido, total)

  return (
    <div>
      <label className={`mb-1 block text-xs font-medium ${c.label}`}>Forma de pagamento</label>
      <div className="grid grid-cols-2 gap-2">
        {METODOS_PAGAMENTO.map((metodo) => {
          const Icone = ICONE_METODO[metodo]
          const ativo = formaPagamento === metodo
          return (
            <button
              key={metodo}
              type="button"
              onClick={() => onChangeFormaPagamento(metodo)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                ativo ? c.tileAtivo : c.tile
              }`}
            >
              <Icone className="h-4 w-4 flex-shrink-0" />
              {metodo}
            </button>
          )
        })}
      </div>

      {ehDinheiro && (
        <div className="mt-2 flex items-end gap-2">
          <div className="flex-1">
            <label className={`mb-1 block text-xs font-medium ${c.label}`}>
              Valor recebido <span className="font-normal opacity-70">(opcional)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valorRecebido}
              onChange={(e) => onChangeValorRecebido(e.target.value)}
              placeholder={`Ex: ${total.toFixed(2).replace('.', ',')}`}
              className={`w-full rounded-lg border px-3 py-2 text-sm ${c.input}`}
            />
          </div>
          {troco !== null && (
            <div className="pb-2 text-right text-sm">
              <span className={c.label}>Troco </span>
              <span className={`font-bold ${troco >= 0 ? c.trocoOk : c.trocoFalta}`}>
                R$ {Math.max(0, troco).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
