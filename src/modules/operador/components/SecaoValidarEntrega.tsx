'use client'

import { useEffect, useState } from 'react'
import { useFilaValidacao } from '../hooks/useFilaValidacao'
import { aceitarValidacao, recusarValidacao, contarPedidosAnteriores } from '../operadorRepository'
import { telefoneParaWhatsApp } from '@/lib/telefone'
import LancarPedidoGarcom from '../../pedidos/garcom/LancarPedidoGarcom'
import type { ValidacaoPedido } from '../types'

function CardValidacao({
  estabelecimentoId,
  validacao,
  onPedidoEditado,
}: {
  estabelecimentoId: string
  validacao: ValidacaoPedido
  onPedidoEditado: () => void
}) {
  const { pedido } = validacao
  const [totalAnteriores, setTotalAnteriores] = useState<number | null>(null)
  const [recusando, setRecusando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    const contagem = pedido.telefone
      ? contarPedidosAnteriores(estabelecimentoId, pedido.telefone, pedido.id)
      : Promise.resolve(0)
    contagem.then(setTotalAnteriores).catch(() => setTotalAnteriores(0))
  }, [estabelecimentoId, pedido.telefone, pedido.id])

  async function aceitar() {
    setEnviando(true)
    try {
      await aceitarValidacao(validacao.id)
    } catch (err) {
      alert(`Não foi possível aceitar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setEnviando(false)
  }

  async function confirmarRecusa() {
    if (!motivo.trim()) return
    setEnviando(true)
    try {
      await recusarValidacao(validacao.id, motivo.trim())
    } catch (err) {
      alert(`Não foi possível recusar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setEnviando(false)
  }

  const conhecido = (totalAnteriores || 0) > 0
  const linkMapa = pedido.endereco_entrega
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pedido.endereco_entrega)}`
    : null

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-800">{pedido.nome_cliente || 'Cliente'}</p>
        {totalAnteriores !== null && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              conhecido ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {conhecido ? `Cliente conhecido (${totalAnteriores})` : 'Primeiro pedido'}
          </span>
        )}
      </div>

      {linkMapa && (
        <a
          href={linkMapa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-xs text-sky-700 underline"
        >
          📍 {pedido.endereco_entrega}
        </a>
      )}

      <p className="mt-1 text-xs text-neutral-500">
        {pedido.metodo_pagamento || 'Forma de pagamento não informada'}
        {pedido.metodo_pagamento === 'Dinheiro' && pedido.observacoes && ` — ${pedido.observacoes}`}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-neutral-700">R$ {pedido.total.toFixed(2)}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {pedido.telefone && (
          <a
            href={telefoneParaWhatsApp(pedido.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Falar no WhatsApp
          </a>
        )}
        <button
          onClick={() => setEditando(true)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Editar pedido
        </button>
        <button
          onClick={aceitar}
          disabled={enviando}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Aceitar
        </button>
        {!recusando ? (
          <button
            onClick={() => setRecusando(true)}
            disabled={enviando}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Recusar
          </button>
        ) : null}
      </div>

      {recusando && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Motivo da recusa..."
            className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs text-neutral-900"
          />
          <div className="flex gap-2">
            <button
              onClick={confirmarRecusa}
              disabled={enviando || !motivo.trim()}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirmar recusa
            </button>
            <button
              onClick={() => { setRecusando(false); setMotivo('') }}
              disabled={enviando}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {editando && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          pedidoEmEdicao={pedido}
          onFechar={() => setEditando(false)}
          onPedidoLancado={() => setEditando(false)}
          onPedidoAtualizado={() => {
            setEditando(false)
            // useFilaValidacao só escuta validacao_pedidos, não orders —
            // editar itens não dispara refetch sozinho aqui, diferente do
            // card de Pix (que escuta orders inteiro).
            onPedidoEditado()
          }}
        />
      )}
    </div>
  )
}

export default function SecaoValidarEntrega({
  estabelecimentoId,
  mostrarTitulo = true,
}: {
  estabelecimentoId: string
  mostrarTitulo?: boolean
}) {
  const { validacoes, carregando, recarregar } = useFilaValidacao(estabelecimentoId)

  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
      {mostrarTitulo && (
        <h2 className="mb-3 text-sm font-bold text-neutral-800">
          🛵 Validar entrega <span className="font-normal text-neutral-500">({validacoes.length})</span>
        </h2>
      )}
      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando...</p>
      ) : validacoes.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhum pedido esperando validação.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {validacoes.map((v) => (
            <CardValidacao key={v.id} estabelecimentoId={estabelecimentoId} validacao={v} onPedidoEditado={recarregar} />
          ))}
        </div>
      )}
    </section>
  )
}
