import { X, Pencil } from 'lucide-react'
import { formatarReais } from '@/lib/moeda'
import type { ItemPedido } from '../types'
import type { EstilosGarcom } from './estilosGarcom'

/**
 * Uma linha da sacola em LancarPedidoGarcom.tsx — nome/qtd/preço + lápis que
 * revela −/+/remover. Existia como duas cópias quase idênticas (uma pro
 * layout "caixa" com sidebar, outra pro layout normal) que já tinham
 * divergido um pouco no CSS (gap-2/truncate/text-xs faltando numa das duas)
 * — unificado aqui na versão mais completa, sem mudança de comportamento.
 */
export default function LinhaCarrinhoGarcom({
  item,
  editando,
  onToggleEditar,
  onAlterarQuantidade,
  onRemover,
  estilos: c,
}: {
  item: ItemPedido
  editando: boolean
  onToggleEditar: () => void
  onAlterarQuantidade: (delta: number) => void
  onRemover: () => void
  estilos: EstilosGarcom
}) {
  const preco = item.preco_promocional ?? item.preco

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate ${c.sacolaTexto}`}>
          {item.quantidade}x {item.nome}
        </span>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className={`font-semibold ${c.itemPreco}`}>R$ {formatarReais(preco * item.quantidade)}</span>
          <button
            onClick={onToggleEditar}
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
          <button onClick={() => onAlterarQuantidade(-1)} className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}>
            −
          </button>
          <span className={`w-5 text-center text-xs ${c.sacolaTexto}`}>{item.quantidade}</span>
          <button onClick={() => onAlterarQuantidade(1)} className={`h-6 w-6 rounded-full border text-xs ${c.qtdBotao}`}>
            +
          </button>
          <button
            onClick={onRemover}
            title="Remover item"
            className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-red-500 transition hover:bg-red-500/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
