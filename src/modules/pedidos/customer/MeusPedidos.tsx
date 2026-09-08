'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { listarPedidosSalvos } from './pedidoAcompanhamentoStorage'
import { BOTAO_PEDIDO_SECUNDARIO } from './estilosBotao'
import { ETIQUETA_STATUS, ETIQUETA_TIPO_PEDIDO, type PedidoAcompanhamento } from '../types'

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// Sem conta de cliente, o histórico é só o que este navegador/aparelho
// guardou (ver pedidoAcompanhamentoStorage.ts) — busca os detalhes de cada
// id salvo no espelho público (mesma tabela da tela de acompanhamento) e
// mantém a ordem "mais recente primeiro" do localStorage, não a ordem que o
// banco devolver.
export default function MeusPedidos({
  slug,
  basePath = '/cardapio',
  // Só o Cardápio V2 precisa disso — pedido feito por ali sempre veio do
  // canal delivery (a visão presencial é só leitura, sem carrinho), então
  // "voltar ao cardápio" sem isso caía na visão presencial por engano,
  // parecendo ter voltado pro cardápio "comum" mesmo estando na URL certa.
  cardapioQuery = '',
}: {
  slug: string
  basePath?: string
  cardapioQuery?: string
}) {
  const [pedidos, setPedidos] = useState<PedidoAcompanhamento[] | null>(null)

  useEffect(() => {
    async function carregar() {
      const salvos = listarPedidosSalvos(slug)
      if (salvos.length === 0) {
        setPedidos([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('pedidos_acompanhamento')
        .select('*')
        .in('id', salvos.map((p) => p.pedidoId))

      const porId = new Map((data || []).map((p) => [p.id, p as PedidoAcompanhamento]))
      // Descarta ids que já sumiram do espelho público (pedido bem antigo
      // que passou da retenção, por exemplo) em vez de mostrar um card vazio.
      setPedidos(salvos.map((s) => porId.get(s.pedidoId)).filter((p): p is PedidoAcompanhamento => !!p))
    }
    carregar()
  }, [slug])

  if (pedidos === null) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (pedidos.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm text-neutral-500">Nenhum pedido feito neste aparelho ainda.</p>
        <Link href={`${basePath}/${slug}${cardapioQuery}`} className={`mt-4 inline-block ${BOTAO_PEDIDO_SECUNDARIO}`}>
          Ver cardápio
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-bold text-neutral-900">Meus pedidos</h1>
      <div className="space-y-3">
        {pedidos.map((pedido) => (
          <Link
            key={pedido.id}
            href={`${basePath}/${slug}/pedido/${pedido.id}`}
            className="block rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition hover:border-orange-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-neutral-900">{pedido.codigo_pedido}</p>
                <p className="text-xs text-neutral-400">
                  {formatarData(pedido.created_at)} · {ETIQUETA_TIPO_PEDIDO[pedido.tipo_pedido]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-700">R$ {pedido.total.toFixed(2)}</p>
                <p className="text-xs text-neutral-500">{ETIQUETA_STATUS[pedido.status]}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href={`${basePath}/${slug}${cardapioQuery}`} className={`mt-4 block ${BOTAO_PEDIDO_SECUNDARIO}`}>
        Voltar ao cardápio
      </Link>
    </div>
  )
}
