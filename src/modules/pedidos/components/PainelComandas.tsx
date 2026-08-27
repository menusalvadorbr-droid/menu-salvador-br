'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePedidosEstabelecimento } from '../hooks/usePedidosEstabelecimento'
import { useChamadosGarcom } from '../hooks/useChamadosGarcom'
import { useValidacoesBloqueantes } from '../hooks/useValidacoesBloqueantes'
import { aceitarValidacao } from '@/modules/operador/operadorRepository'
import { ETIQUETA_STATUS, ETIQUETA_TIPO_PEDIDO, type StatusPedido } from '../types'

const COLUNAS: StatusPedido[] = ['recebido', 'aprovado', 'em_preparo', 'pronto', 'entregue']

// "entregue" não avança sozinho pra "pago" — pagamento precisa de forma de
// pagamento/desconto/troco e checar se o caixa está aberto, nada disso dá
// pra fazer com um clique cego aqui. Fecha pelo mapa de mesas (pedido de
// mesa) ou pelo Caixa (avulso — balcão/retirada/entrega), ver botão abaixo.
const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  recebido: 'aprovado',
  aprovado: 'em_preparo',
  em_preparo: 'pronto',
  pronto: 'entregue',
}

export default function PainelComandas({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { pedidos, carregando, mudarStatus } = usePedidosEstabelecimento(estabelecimentoId)
  const { chamados, atender } = useChamadosGarcom(estabelecimentoId)
  const validacoesBloqueantes = useValidacoesBloqueantes(estabelecimentoId)
  const [liberando, setLiberando] = useState<string | null>(null)

  async function liberarMesmoAssim(validacaoId: string) {
    setLiberando(validacaoId)
    try {
      await aceitarValidacao(validacaoId)
    } catch (err) {
      alert(`Não foi possível liberar o pedido: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
    setLiberando(null)
  }

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
                  // Pedido de entrega ainda não liberado pela Fila do
                  // Operador (Validar entrega) — bloqueia só a transição
                  // aprovado→em_preparo, que é literalmente "entrar na
                  // cozinha". Demais transições seguem livres.
                  const bloqueio = proximo === 'em_preparo' ? validacoesBloqueantes.get(pedido.id) : undefined
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
                      {bloqueio ? (
                        bloqueio.status === 'pendente' ? (
                          <p className="mt-2 rounded-lg bg-amber-50 py-1.5 text-center text-xs font-semibold text-amber-700">
                            ⏳ Aguardando validação de entrega
                          </p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">
                              ❌ Entrega recusada: {bloqueio.motivo_recusa}
                            </p>
                            <button
                              onClick={() => liberarMesmoAssim(bloqueio.id)}
                              disabled={liberando === bloqueio.id}
                              className="w-full rounded-lg border border-red-200 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {liberando === bloqueio.id ? 'Liberando...' : 'Aceitar mesmo assim'}
                            </button>
                          </div>
                        )
                      ) : (
                        proximo && (
                          <button
                            onClick={() => mudarStatus(pedido.id, proximo)}
                            className="mt-2 w-full rounded-lg bg-orange-600 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                          >
                            Marcar como {ETIQUETA_STATUS[proximo]}
                          </button>
                        )
                      )}
                      {pedido.status === 'entregue' && (
                        <Link
                          href={
                            pedido.mesa_id
                              ? `/painel/estabelecimento/${estabelecimentoId}/pedidos/mesas`
                              : `/painel/estabelecimento/${estabelecimentoId}/caixa`
                          }
                          className="mt-2 block w-full rounded-lg bg-green-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-green-700"
                        >
                          💳 Fechar conta {pedido.mesa_id ? 'no mapa de mesas' : 'no Caixa'} →
                        </Link>
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
