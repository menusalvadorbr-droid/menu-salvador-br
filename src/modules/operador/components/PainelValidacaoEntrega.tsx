'use client'

import { useEffect, useState } from 'react'
import { telefoneParaWhatsApp } from '@/lib/telefone'
import { aceitarValidacao, recusarValidacao, contarPedidosAnteriores } from '../operadorRepository'
import { haQuantoTempo } from '../tempoEspera'
import LancarPedidoGarcom from '../../pedidos/garcom/LancarPedidoGarcom'
import type { ValidacaoPedido } from '../types'

/** Painel de detalhe pra uma entrega aguardando validação — mesma lógica
 *  de aceitar/recusar que LinhaFilaValidacao.tsx tinha como linha
 *  compacta, agora como o painel cheio da Central do Operador. */
export default function PainelValidacaoEntrega({
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
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const contagem = pedido.telefone
      ? contarPedidosAnteriores(estabelecimentoId, pedido.telefone, pedido.id)
      : Promise.resolve(0)
    contagem.then(setTotalAnteriores).catch(() => setTotalAnteriores(0))
  }, [estabelecimentoId, pedido.telefone, pedido.id])

  async function aceitar() {
    setEnviando(true)
    setErro(null)
    try {
      await aceitarValidacao(validacao.id)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível aceitar.')
      setEnviando(false)
    }
  }

  async function confirmarRecusa() {
    if (!motivo.trim()) return
    setEnviando(true)
    setErro(null)
    try {
      await recusarValidacao(validacao.id, motivo.trim())
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível recusar.')
      setEnviando(false)
    }
  }

  const conhecido = (totalAnteriores || 0) > 0
  const linkMapa = pedido.endereco_entrega
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pedido.endereco_entrega)}`
    : null

  return (
    <>
      <div className="shrink-0 border-b border-neutral-100 px-6 pb-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[22px] font-bold leading-tight text-neutral-900">{pedido.nome_cliente || 'Cliente'}</p>
          {totalAnteriores !== null && (
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                conhecido ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {conhecido ? `Cliente conhecido (${totalAnteriores})` : 'Primeiro pedido'}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs font-medium text-neutral-600">
          Pedido {pedido.codigo_pedido} · esperando há {haQuantoTempo(validacao.created_at)}
          {pedido.metodo_pagamento && ` · ${pedido.metodo_pagamento}`}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div className="flex items-baseline justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-6 py-5">
          <span className="text-sm font-semibold text-neutral-600">Total do pedido</span>
          <span className="text-3xl font-extrabold text-neutral-900">R$ {pedido.total.toFixed(2)}</span>
        </div>

        {linkMapa && (
          <a href={linkMapa} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-sky-700 underline">
            📍 {pedido.endereco_entrega}
          </a>
        )}

        {recusando && (
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Motivo da recusa…"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmarRecusa}
                disabled={enviando || !motivo.trim()}
                className="shrink-0 whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar recusa
              </button>
              <button
                onClick={() => { setRecusando(false); setMotivo('') }}
                disabled={enviando}
                className="shrink-0 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {erro && <p className="text-xs text-red-600">{erro}</p>}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-neutral-100 px-6 py-4">
        {pedido.telefone && (
          <a
            href={telefoneParaWhatsApp(pedido.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            WhatsApp
          </a>
        )}
        <button
          onClick={() => setEditando(true)}
          className="flex-1 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Editar pedido
        </button>
        {!recusando && (
          <button
            onClick={() => setRecusando(true)}
            disabled={enviando}
            className="flex-1 whitespace-nowrap rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Recusar
          </button>
        )}
        <button
          onClick={aceitar}
          disabled={enviando}
          className="flex-1 whitespace-nowrap rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          Aceitar
        </button>
      </div>

      {editando && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          pedidoEmEdicao={pedido}
          onFechar={() => setEditando(false)}
          onPedidoLancado={() => setEditando(false)}
          onPedidoAtualizado={() => { setEditando(false); onPedidoEditado() }}
        />
      )}
    </>
  )
}
