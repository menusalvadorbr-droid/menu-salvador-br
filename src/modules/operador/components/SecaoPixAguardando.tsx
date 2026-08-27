'use client'

import { useState } from 'react'
import { useFilaPix } from '../hooks/useFilaPix'
import { confirmarPagamentoPix } from '../operadorRepository'
import { telefoneParaWhatsApp } from '@/lib/telefone'
import LancarPedidoGarcom from '../../pedidos/garcom/LancarPedidoGarcom'
import type { Pedido } from '../../pedidos/types'

export default function SecaoPixAguardando({
  estabelecimentoId,
  mostrarTitulo = true,
}: {
  estabelecimentoId: string
  mostrarTitulo?: boolean
}) {
  const { pedidos, carregando } = useFilaPix(estabelecimentoId)
  const [valoresConferencia, setValoresConferencia] = useState<Record<string, string>>({})
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)

  async function confirmar(pedidoId: string) {
    setConfirmando(pedidoId)
    try {
      await confirmarPagamentoPix(estabelecimentoId, pedidoId)
    } catch (err) {
      alert(`Não foi possível confirmar o pagamento: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setConfirmando(null)
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
      {mostrarTitulo && (
        <h2 className="mb-3 text-sm font-bold text-sky-800">
          💳 Pix aguardando confirmação <span className="font-normal text-sky-600">({pedidos.length})</span>
        </h2>
      )}
      {carregando ? (
        <p className="text-sm text-sky-600">Carregando...</p>
      ) : pedidos.length === 0 ? (
        <p className="text-sm text-sky-600">Nenhum Pix aguardando confirmação.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-xl border border-sky-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-800">{p.nome_cliente || 'Cliente'}</p>
                <p className="text-sm font-bold text-neutral-900">R$ {p.total.toFixed(2)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Valor visto no extrato"
                  value={valoresConferencia[p.id] || ''}
                  onChange={(e) => setValoresConferencia((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-40 rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-900"
                />
                {p.telefone && (
                  <a
                    href={telefoneParaWhatsApp(p.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Falar no WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setPedidoEditando(p)}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Editar pedido
                </button>
                <button
                  onClick={() => confirmar(p.id)}
                  disabled={confirmando === p.id}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {confirmando === p.id ? 'Confirmando...' : 'Confirmar pago'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pedidoEditando && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          pedidoEmEdicao={pedidoEditando}
          onFechar={() => setPedidoEditando(null)}
          onPedidoLancado={() => setPedidoEditando(null)}
          onPedidoAtualizado={() => setPedidoEditando(null)}
        />
      )}
    </section>
  )
}
