import { precoEfetivo } from '../types'
import { calcularDesconto } from '@/lib/desconto'
import { formatarReais } from '@/lib/moeda'
import type { VendaBalcaoPausada } from './vendasPausadasRepository'
import type { EstilosGarcom } from './estilosGarcom'

function totalDaPausada(p: VendaBalcaoPausada): number {
  const subtotal = p.itens.reduce((acc, item) => acc + precoEfetivo(item) * item.quantidade, 0)
  const desconto = calcularDesconto(subtotal, p.tipo_desconto, parseFloat((p.desconto_input || '0').replace(',', '.')) || 0)
  return Math.max(0, subtotal - desconto)
}

/**
 * Tira de vendas pausadas — só aparece quando há pelo menos uma (não ocupa
 * espaço à toa). Cada chip mostra nome/valor e um botão de retomar; excluir
 * fica atrás de um "×" pra não ser confundido com retomar num toque errado.
 */
export default function VendasPausadasBarra({
  pausadas,
  onRetomar,
  onExcluir,
  estilos: c,
}: {
  pausadas: VendaBalcaoPausada[]
  onRetomar: (p: VendaBalcaoPausada) => void
  onExcluir: (p: VendaBalcaoPausada) => void
  estilos: EstilosGarcom
}) {
  if (pausadas.length === 0) return null

  return (
    <div className={`flex shrink-0 items-center gap-2 overflow-x-auto border-b p-2 ${c.borda}`}>
      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">
        ⏸ {pausadas.length}
      </span>
      {pausadas.map((p) => (
        <div
          key={p.id}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-1 pl-2.5 pr-1.5 text-xs"
        >
          <div className="min-w-0">
            <p className="max-w-[9rem] truncate font-semibold text-amber-900">{p.nome_cliente || 'Sem nome'}</p>
            <p className="text-amber-700">R$ {formatarReais(totalDaPausada(p))}</p>
          </div>
          <button
            type="button"
            onClick={() => onRetomar(p)}
            className="shrink-0 rounded-lg bg-amber-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700"
          >
            Retomar
          </button>
          <button
            type="button"
            onClick={() => onExcluir(p)}
            title="Descartar venda pausada"
            className="shrink-0 px-1 text-amber-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
