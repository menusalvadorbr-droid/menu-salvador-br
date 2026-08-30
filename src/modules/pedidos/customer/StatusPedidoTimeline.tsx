import { ETIQUETA_STATUS, type PedidoAcompanhamento, type StatusPedido } from '../types'

const PASSOS: StatusPedido[] = ['recebido', 'aprovado', 'em_preparo', 'pronto', 'entregue']

// Nem todo passo tem timestamp próprio — "em_preparo" não grava um (ver
// PedidoAcompanhamento), só mostra o horário de quem tem.
const CAMPO_TIMESTAMP_POR_PASSO: Partial<Record<StatusPedido, 'created_at' | 'approved_at' | 'ready_at' | 'delivered_at'>> = {
  recebido: 'created_at',
  aprovado: 'approved_at',
  pronto: 'ready_at',
  entregue: 'delivered_at',
}

function formatarHora(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** "Pago" não é um passo do preparo — é um selo que pode acontecer a
 *  qualquer momento da linha (pedido Pix online paga antes de a cozinha
 *  sequer aprovar; pedido de mesa paga só depois de entregue). Quando o
 *  status atual é "pago", o valor literal do campo já não diz em que
 *  passo o preparo realmente está (foi sobrescrito na confirmação do
 *  pagamento) — reconstrói a partir dos timestamps de preparo, que
 *  continuam gravados independente do pagamento. Sem isso, todo pedido
 *  pago aparecia como "Entregue" na hora, mesmo quando a cozinha ainda
 *  nem tinha começado. */
function statusRealDoPreparo(pedido: PedidoAcompanhamento): StatusPedido {
  if (pedido.status !== 'pago') return pedido.status
  if (pedido.delivered_at) return 'entregue'
  if (pedido.ready_at) return 'pronto'
  if (pedido.approved_at) return 'aprovado'
  return 'recebido'
}

export default function StatusPedidoTimeline({ pedido }: { pedido: PedidoAcompanhamento }) {
  if (pedido.status === 'cancelado') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
        ❌ Esse pedido foi cancelado.
      </div>
    )
  }

  const statusEfetivo = statusRealDoPreparo(pedido)
  const indiceAtual = PASSOS.indexOf(statusEfetivo)

  return (
    <div>
      <div className="flex flex-col">
        {PASSOS.map((passo, i) => {
          const concluido = i <= indiceAtual
          const atual = i === indiceAtual
          const campo = CAMPO_TIMESTAMP_POR_PASSO[passo]
          const hora = campo ? formatarHora(pedido[campo]) : null
          return (
            <div key={passo} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors ${
                    concluido ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-400'
                  } ${atual ? 'ring-4 ring-orange-100' : ''}`}
                >
                  {concluido ? '✓' : ''}
                </div>
                {i < PASSOS.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 transition-colors ${i < indiceAtual ? 'bg-orange-600' : 'bg-neutral-100'}`}
                    style={{ minHeight: 28 }}
                  />
                )}
              </div>
              <div className="pb-7">
                <p className={`text-sm font-semibold ${concluido ? 'text-neutral-900' : 'text-neutral-400'}`}>
                  {ETIQUETA_STATUS[passo]}
                </p>
                {hora && <p className="text-xs text-neutral-400">{hora}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {pedido.status === 'pago' && (
        <p className="text-sm font-medium text-green-700">💰 Pagamento confirmado.</p>
      )}
    </div>
  )
}
