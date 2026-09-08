'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAcompanharPedido } from '@/modules/pedidos/customer/useAcompanharPedido'
import StatusPedidoTimeline from '@/modules/pedidos/customer/StatusPedidoTimeline'
import PixPagamentoCard from '@/modules/pedidos/customer/PixPagamentoCard'
import { ehPixPendente, precoEfetivo, type PedidoAcompanhamento } from '@/modules/pedidos/types'
import { BOTAO_PEDIDO_SECUNDARIO } from '@/modules/pedidos/customer/estilosBotao'

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarOrigem(pedido: PedidoAcompanhamento): string {
  if (pedido.tipo_pedido === 'mesa') return pedido.mesa ? `Mesa ${pedido.mesa}` : 'Mesa'
  if (pedido.tipo_pedido === 'entrega') return 'Delivery'
  if (pedido.tipo_pedido === 'retirada') return 'Retirada'
  return 'Balcão'
}

export default function AcompanharPedido({
  slug,
  pedidoId,
  nomeEstabelecimento,
  chavePix,
  cidade,
  basePath = '/cardapio',
  cardapioQuery = '',
}: {
  slug: string
  pedidoId: string
  nomeEstabelecimento: string
  chavePix: string | null
  cidade: string | null
  // V1 usa /cardapio (padrão); Cardápio V2 passa /cardapio-v2.
  basePath?: string
  // Cardápio V2 passa "?canal=delivery" — pedido feito por ali sempre veio
  // desse canal (a visão presencial é só leitura), então "voltar ao
  // cardápio" sem isso caía na visão presencial por engano, sem carrinho —
  // parecia ter voltado pro cardápio "comum" mesmo na URL certa.
  cardapioQuery?: string
}) {
  const { pedido, carregando, naoEncontrado } = useAcompanharPedido(pedidoId)
  const [pixAberto, setPixAberto] = useState(false)

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
        <Link href={`${basePath}/${slug}${cardapioQuery}`} className={`mt-4 inline-block ${BOTAO_PEDIDO_SECUNDARIO}`}>
          Voltar ao cardápio
        </Link>
      </div>
    )
  }

  const pixPendente = ehPixPendente(pedido)

  // Preço por item já vem com variação/complementos embutidos (ver
  // SeletorItemModal.tsx) — só falta aplicar promoção por linha
  // (precoEfetivo, mesma regra de useSacola.ts) pra bater com o total
  // real do pedido. Acréscimo não tem coluna própria no sistema hoje
  // (taxa de entrega é combinada fora do app) — calculado por diferença
  // em vez de inventar um campo sem dado nenhum por trás, o que também
  // absorve de graça qualquer ajuste manual futuro no total.
  const subtotal = pedido.items.reduce((acc, item) => acc + precoEfetivo(item) * item.quantidade, 0)
  const desconto = pedido.desconto || 0
  const acrescimo = Math.max(0, pedido.total - subtotal + desconto)

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-neutral-400">{nomeEstabelecimento}</p>

      {/* Régua de status sempre visível — o preparo pode andar mesmo com o
          Pix ainda pendente (a cozinha não precisa esperar a confirmação
          pra começar em todo estabelecimento), e esconder isso atrás do
          Pix escondia esse progresso de quem só queria acompanhar. */}
      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <StatusPedidoTimeline pedido={pedido} />
      </div>

      {pixPendente &&
        (pixAberto ? (
          <PixPagamentoCard
            chavePix={chavePix}
            nomeFantasia={nomeEstabelecimento}
            cidade={cidade}
            valor={pedido.total}
            codigoPedido={pedido.codigo_pedido}
          />
        ) : (
          <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-center shadow-sm">
            <p className="mb-3 text-sm font-medium text-neutral-600">
              ⏳ Aguardando pagamento — assim que identificarmos o Pix, o andamento do seu pedido aparece aqui.
            </p>
            <button
              onClick={() => setPixAberto(true)}
              className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              💳 Pagar com Pix
            </button>
          </div>
        ))}

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <p className="text-xs text-neutral-400">Código do pedido</p>
            <p className="text-xl font-black tracking-wide text-neutral-900">{pedido.codigo_pedido}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400">{formatarHora(pedido.created_at)}</p>
            <p className="text-sm font-semibold text-neutral-700">{formatarOrigem(pedido)}</p>
          </div>
        </div>
        {pedido.metodo_pagamento && (
          <p className="pt-2 text-xs text-neutral-400">Pagamento: {pedido.metodo_pagamento}</p>
        )}

        <ul className="mt-3 space-y-1 text-sm text-neutral-700">
          {pedido.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>{item.quantidade}x {item.nome}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-neutral-500">
              <span>Desconto</span>
              <span>− R$ {desconto.toFixed(2)}</span>
            </div>
          )}
          {acrescimo > 0.01 && (
            <div className="flex justify-between text-neutral-500">
              <span>Acréscimo</span>
              <span>+ R$ {acrescimo.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-bold text-neutral-900">
            <span>Total</span>
            <span>R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={`${basePath}/${slug}${cardapioQuery}`} className={`flex-1 ${BOTAO_PEDIDO_SECUNDARIO}`}>
          Voltar ao cardápio
        </Link>
        <Link href={`${basePath}/${slug}/pedidos`} className={`flex-1 ${BOTAO_PEDIDO_SECUNDARIO}`}>
          Meus pedidos
        </Link>
      </div>
    </div>
  )
}
