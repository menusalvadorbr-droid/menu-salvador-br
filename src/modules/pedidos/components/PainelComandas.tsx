'use client'

import { usePedidosEstabelecimento } from '../hooks/usePedidosEstabelecimento'
import { useChamadosGarcom } from '../hooks/useChamadosGarcom'
import { ETIQUETA_STATUS, ETIQUETA_TIPO_PEDIDO, type StatusPedido } from '../types'

const COLUNAS: StatusPedido[] = ['recebido', 'aprovado', 'em_preparo', 'pronto', 'entregue']

const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  recebido: 'aprovado',
  aprovado: 'em_preparo',
  em_preparo: 'pronto',
  pronto: 'entregue',
  entregue: 'pago',
}

export default function PainelComandas({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { pedidos, carregando, mudarStatus } = usePedidosEstabelecimento(estabelecimentoId)
  const { chamados, atender } = useChamadosGarcom(estabelecimentoId)

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        Carregando pedidos...
      </div>
    )
  }

  return (
    <div>
      {chamados.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {chamados.map((chamado) => (
            <div
              key={chamado.id}
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
            >
              <span>🔔 Mesa {chamado.mesa} chamou o garçom</span>
              <button
                onClick={() => atender(chamado.id)}
                className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Atendido
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-3 lg:grid-cols-5">
        {COLUNAS.map((status) => {
          const pedidosDaColuna = pedidos.filter((p) => p.status === status)
          return (
            <div key={status} className="flex min-w-[220px] flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-700">
                {ETIQUETA_STATUS[status]} <span className="text-neutral-400">({pedidosDaColuna.length})</span>
              </h3>
              <div className="flex flex-col gap-2">
                {pedidosDaColuna.map((pedido) => {
                  const proximo = PROXIMO_STATUS[pedido.status]
                  return (
                    <div
                      key={pedido.id}
                      className="rounded-xl border border-neutral-100 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-900">
                          {pedido.nome_cliente || 'Cliente'}
                        </p>
                        {pedido.origem === 'whatsapp_contingencia' && (
                          <span title="Recebido via WhatsApp em contingência">📲</span>
                        )}
                        {pedido.origem === 'garcom' && (
                          <span title="Lançado pelo garçom">🧑‍🍳</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                        <span>{ETIQUETA_TIPO_PEDIDO[pedido.tipo_pedido]}</span>
                        {pedido.mesa && <span>· Mesa {pedido.mesa}</span>}
                      </div>
                      {pedido.endereco_entrega && (
                        <p className="mt-1 text-xs text-neutral-500">📍 {pedido.endereco_entrega}</p>
                      )}
                      <ul className="mt-2 space-y-0.5 text-xs text-neutral-600">
                        {pedido.items.map((item, i) => (
                          <li key={i}>
                            {item.quantidade}x {item.nome}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">
                        R$ {pedido.total.toFixed(2)}
                      </p>
                      {proximo && (
                        <button
                          onClick={() => mudarStatus(pedido.id, proximo)}
                          className="mt-2 w-full rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          Marcar como {ETIQUETA_STATUS[proximo]}
                        </button>
                      )}
                    </div>
                  )
                })}
                {pedidosDaColuna.length === 0 && (
                  <p className="rounded-xl border border-dashed border-neutral-200 p-3 text-center text-xs text-neutral-300">
                    Nenhum pedido
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
