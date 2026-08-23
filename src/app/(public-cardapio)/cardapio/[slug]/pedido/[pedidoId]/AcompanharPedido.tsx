'use client'

import Link from 'next/link'
import { useAcompanharPedido } from '@/modules/pedidos/customer/useAcompanharPedido'
import StatusPedidoTimeline from '@/modules/pedidos/customer/StatusPedidoTimeline'
import { ETIQUETA_TIPO_PEDIDO } from '@/modules/pedidos/types'
import { BOTAO_PEDIDO_SECUNDARIO } from '@/modules/pedidos/customer/estilosBotao'

export default function AcompanharPedido({
  slug,
  pedidoId,
  nomeEstabelecimento,
}: {
  slug: string
  pedidoId: string
  nomeEstabelecimento: string
}) {
  const { pedido, carregando, naoEncontrado } = useAcompanharPedido(pedidoId)

  if (carregando) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (naoEncontrado || !pedido) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-neutral-500">Não encontramos esse pedido.</p>
        <Link href={`/cardapio/${slug}`} className={`mt-4 inline-block ${BOTAO_PEDIDO_SECUNDARIO}`}>
          Voltar ao cardápio
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{nomeEstabelecimento}</p>
      <h1 className="mb-6 text-xl font-bold text-neutral-900">📦 Acompanhar pedido</h1>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <StatusPedidoTimeline pedido={pedido} />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-xs text-neutral-500">
          <span>{ETIQUETA_TIPO_PEDIDO[pedido.tipo_pedido]}</span>
          {pedido.mesa && <span>Mesa {pedido.mesa}</span>}
        </div>
        <ul className="space-y-1 text-sm text-neutral-700">
          {pedido.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{item.quantidade}x {item.nome}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 text-sm font-bold text-neutral-900">
          <span>Total</span>
          <span>R$ {pedido.total.toFixed(2)}</span>
        </div>
      </div>

      <Link href={`/cardapio/${slug}`} className={`block ${BOTAO_PEDIDO_SECUNDARIO}`}>
        Voltar ao cardápio
      </Link>
    </div>
  )
}
