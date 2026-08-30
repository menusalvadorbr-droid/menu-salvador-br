'use client'

import { useState } from 'react'
import { usePedidosCompra } from '../hooks/usePedidosCompra'
import PedidoCompraForm from './PedidoCompraForm'
import { formatarReais } from '@/lib/moeda'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'

const ETIQUETA_STATUS: Record<string, { label: string; cor: string }> = {
  pendente: { label: '🕓 Pendente', cor: 'text-amber-600' },
  recebido: { label: '✅ Recebido', cor: 'text-green-600' },
  cancelado: { label: '❌ Cancelado', cor: 'text-neutral-400' },
}

export default function ListaPedidosCompra({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { pedidos, carregando, processando, receber, cancelar } = usePedidosCompra(estabelecimentoId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [confirmandoCancelamentoId, setConfirmandoCancelamentoId] = useState<string | null>(null)

  if (carregando) return <div className="py-12 text-center text-neutral-400">Carregando pedidos de compra...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{pedidos.length} pedidos de compra</p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo pedido de compra'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4">
          <PedidoCompraForm estabelecimentoId={estabelecimentoId} onCriado={() => setMostrarForm(false)} />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {pedidos.map((pedido) => {
          const status = ETIQUETA_STATUS[pedido.status] || ETIQUETA_STATUS.pendente
          return (
            <div key={pedido.id} className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {pedido.fornecedor?.nome || 'Sem fornecedor definido'}
                </p>
                <p className="text-xs text-neutral-500">
                  {new Date(pedido.criado_em).toLocaleString('pt-BR')} · R$ {formatarReais(pedido.valor_total)}
                </p>
                {pedido.observacoes && <p className="text-xs text-neutral-400">{pedido.observacoes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${status.cor}`}>{status.label}</span>
                {pedido.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => receber(pedido.id)}
                      disabled={processando}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirmar recebimento
                    </button>
                    <button
                      onClick={() => setConfirmandoCancelamentoId(pedido.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
        {pedidos.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
            Nenhum pedido de compra ainda.
          </p>
        )}
      </div>

      {confirmandoCancelamentoId && (
        <ConfirmarAcaoModal
          tema="claro"
          tom="perigo"
          titulo="Cancelar pedido de compra"
          descricao="Cancelar este pedido?"
          confirmarLabel="Cancelar pedido"
          enviando={processando}
          onCancelar={() => setConfirmandoCancelamentoId(null)}
          onConfirmar={() => {
            cancelar(confirmandoCancelamentoId)
            setConfirmandoCancelamentoId(null)
          }}
        />
      )}
    </div>
  )
}
