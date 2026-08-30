'use client'

import { useCallback, useEffect, useState } from 'react'
import { listarPedidosAvulsosAguardandoPagamento } from '@/modules/pedidos/ordersRepository'
import FecharPedidoAvulsoModal from '@/modules/pedidos/components/FecharPedidoAvulsoModal'
import { ETIQUETA_TIPO_PEDIDO, type Pedido } from '@/modules/pedidos/types'
import { formatarReais } from '@/lib/moeda'
import { caixaTema } from '../caixaTema'

/**
 * Pedidos avulsos (balcão/retirada/entrega — sem mesa) já entregues e
 * aguardando pagamento. Antes disso existir, a única forma de fechar esses
 * pedidos era um botão "Marcar como pago" direto no quadro de comandas,
 * sem passar por forma de pagamento/desconto/troco nem checar se o caixa
 * estava aberto — esse painel substitui aquele botão.
 */
export default function PedidosAvulsosPendentes({
  estabelecimentoId,
  caixaAberto,
  onFechado,
}: {
  estabelecimentoId: string
  caixaAberto: boolean
  /** Chamado depois de fechar um pedido com sucesso, além da própria lista
   *  se recarregar sozinha — pra quem chama também atualizar o resumo do
   *  turno (total de vendas etc.), que muda com esse pagamento. */
  onFechado?: () => void
}) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null)

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidosAvulsosAguardandoPagamento(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (carregando || pedidos.length === 0) return null

  return (
    <div className={`${caixaTema.painel} p-5`}>
      <p className="mb-3 text-sm font-semibold text-neutral-900">🧾 Pedidos aguardando pagamento</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {pedidos.map((pedido) => (
          <button
            key={pedido.id}
            onClick={() => setPedidoSelecionado(pedido)}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left transition hover:border-amber-300 hover:bg-amber-100"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-amber-700">
              <span>{ETIQUETA_TIPO_PEDIDO[pedido.tipo_pedido]}</span>
              <span>R$ {formatarReais(pedido.total)}</span>
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-amber-900">
              {pedido.nome_cliente || 'Cliente'}
            </div>
            <div className="mt-0.5 text-xs font-medium text-amber-700">💳 Fechar conta</div>
          </button>
        ))}
      </div>

      {pedidoSelecionado && (
        <FecharPedidoAvulsoModal
          estabelecimentoId={estabelecimentoId}
          pedido={pedidoSelecionado}
          caixaAberto={caixaAberto}
          onFechar={() => setPedidoSelecionado(null)}
          onContaFechada={() => {
            setPedidoSelecionado(null)
            carregar()
            onFechado?.()
          }}
        />
      )}
    </div>
  )
}
