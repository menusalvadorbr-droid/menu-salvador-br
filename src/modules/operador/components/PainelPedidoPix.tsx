'use client'

import { useState } from 'react'
import { telefoneParaWhatsApp } from '@/lib/telefone'
import { confirmarPagamentoPix } from '../operadorRepository'
import { haQuantoTempo } from '../tempoEspera'
import LancarPedidoGarcom from '../../pedidos/garcom/LancarPedidoGarcom'
import type { Pedido } from '../../pedidos/types'

function subtituloPedido(pedido: Pedido): string {
  const nItens = pedido.items?.length || 0
  const base = `${nItens} ${nItens === 1 ? 'item' : 'itens'}`
  if (pedido.tipo_pedido === 'retirada') return `${base} · retirada no balcão`
  if (pedido.tipo_pedido === 'balcao') return `${base} · balcão`
  if (pedido.tipo_pedido === 'mesa') return pedido.mesa ? `${base} · mesa ${pedido.mesa}` : base
  if (pedido.tipo_pedido === 'entrega') {
    const primeiraLinha = pedido.endereco_entrega?.split(',')[0]?.trim()
    return primeiraLinha ? `${base} · entrega ${primeiraLinha}` : `${base} · entrega`
  }
  return base
}

/** Painel de detalhe pra um Pix aguardando confirmação — mesma lógica de
 *  confirmação (com aviso de divergência do valor conferido) que
 *  LinhaFilaPix.tsx tinha como linha compacta, agora como o painel cheio
 *  da Central do Operador. */
export default function PainelPedidoPix({
  estabelecimentoId,
  pedido,
}: {
  estabelecimentoId: string
  pedido: Pedido
}) {
  const [valorConferencia, setValorConferencia] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [avisoDivergencia, setAvisoDivergencia] = useState(false)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function executarConfirmacao() {
    setConfirmando(true)
    setErro(null)
    try {
      await confirmarPagamentoPix(estabelecimentoId, pedido.id)
      // Sem setConfirmando(false) no sucesso: o pedido sai da query de
      // "Pix pendente" e o item some da lista sozinho via Realtime.
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao confirmar pagamento.')
      setConfirmando(false)
    }
  }

  function confirmar() {
    const digitado = parseFloat(valorConferencia.replace(',', '.'))
    const divergeDoTotal = valorConferencia.trim() !== '' && !Number.isNaN(digitado) && Math.abs(digitado - pedido.total) > 0.01
    if (divergeDoTotal && !avisoDivergencia) {
      setAvisoDivergencia(true)
      return
    }
    executarConfirmacao()
  }

  return (
    <>
      <div className="shrink-0 border-b border-neutral-100 px-6 pb-4 pt-6">
        <p className="text-[22px] font-bold leading-tight text-neutral-900">{pedido.nome_cliente || 'Cliente'}</p>
        <p className="mt-1 text-xs font-medium text-neutral-600">
          Pedido {pedido.codigo_pedido} · esperando há {haQuantoTempo(pedido.created_at)} · {subtituloPedido(pedido)}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        <div className="flex items-baseline justify-between rounded-2xl border border-sky-100 bg-sky-50 px-6 py-5">
          <span className="text-sm font-semibold text-sky-700">Total do pedido</span>
          <span className="text-3xl font-extrabold text-sky-900">R$ {pedido.total.toFixed(2)}</span>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-600">Valor visto no extrato</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={valorConferencia}
            onChange={(e) => { setValorConferencia(e.target.value); setAvisoDivergencia(false) }}
            className="mt-1.5 block w-48 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {avisoDivergencia && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-800">
            <span>
              O valor digitado (R$ {valorConferencia.replace('.', ',')}) é diferente do total do pedido (R$ {pedido.total.toFixed(2)}).
            </span>
            <button onClick={executarConfirmacao} className="shrink-0 whitespace-nowrap font-bold underline">
              Confirmar assim mesmo
            </button>
          </div>
        )}

        {erro && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            <span>{erro}</span>
            <button onClick={executarConfirmacao} className="shrink-0 whitespace-nowrap font-bold underline">
              Tentar de novo
            </button>
          </div>
        )}
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
        <button
          onClick={confirmar}
          disabled={confirmando}
          className="flex-[2] whitespace-nowrap rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {confirmando ? 'Confirmando…' : 'Confirmar pago'}
        </button>
      </div>

      {editando && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          pedidoEmEdicao={pedido}
          onFechar={() => setEditando(false)}
          onPedidoLancado={() => setEditando(false)}
          onPedidoAtualizado={() => setEditando(false)}
        />
      )}
    </>
  )
}
