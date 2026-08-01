'use client'

import { useState } from 'react'
import { listarPagamentosDaMesaNaSessao } from '../caixaRepository'
import type { VendaSessao, PagamentoMesa } from '../types'

const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * Uma linha da lista de vendas do caixa, clicável — expande pra mostrar o
 * detalhe: linha do tempo completa do pedido (tipo 'pedido'), ou o
 * histórico de todas as parcelas pagas por aquela mesa nessa sessão (tipo
 * 'pagamento', buscado sob demanda só quando a linha é aberta).
 */
export default function VendaSessaoRow({ venda, caixaSessaoId }: { venda: VendaSessao; caixaSessaoId: string }) {
  const [aberta, setAberta] = useState(false)
  const [parcelas, setParcelas] = useState<PagamentoMesa[] | null>(null)
  const [carregandoParcelas, setCarregandoParcelas] = useState(false)

  async function toggle() {
    const abrindo = !aberta
    setAberta(abrindo)
    if (abrindo && venda.tipo === 'pagamento' && venda.mesaId && parcelas === null) {
      setCarregandoParcelas(true)
      try {
        setParcelas(await listarPagamentosDaMesaNaSessao(venda.mesaId, caixaSessaoId))
      } finally {
        setCarregandoParcelas(false)
      }
    }
  }

  return (
    <>
      <tr onClick={toggle} className="cursor-pointer hover:bg-neutral-50">
        <td className="py-2 pr-3 text-neutral-700">
          {fmtHora(venda.pagoEm)}
          {venda.tipo === 'pedido' && venda.criadoEm !== venda.pagoEm && (
            <span className="block text-xs text-neutral-400">pedido às {fmtHora(venda.criadoEm)}</span>
          )}
        </td>
        <td className="py-2 pr-3 text-neutral-600">{venda.mesa ? `Mesa ${venda.mesa}` : '—'}</td>
        <td className="py-2 pr-3 text-neutral-600">
          {venda.tipo === 'pedido' ? 'Pedido' : '💳 Pagamento'}
          {venda.nomeCliente && <span className="text-neutral-400"> · {venda.nomeCliente}</span>}
        </td>
        <td className="py-2 pr-3 text-neutral-600">{venda.formaPagamento || '—'}</td>
        <td className="py-2 pl-3 text-right font-semibold text-neutral-900">
          R$ {venda.valor.toFixed(2)}
          <span className="ml-1 text-xs text-neutral-300">{aberta ? '▲' : '▼'}</span>
        </td>
      </tr>
      {aberta && (
        <tr>
          <td colSpan={5} className="bg-neutral-50 px-3 py-3">
            {venda.tipo === 'pedido' ? (
              <TimelinePedido venda={venda} />
            ) : carregandoParcelas ? (
              <p className="text-xs text-neutral-400">Carregando parcelas...</p>
            ) : (
              <div className="space-y-1">
                {(parcelas || []).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 text-xs text-neutral-600">
                    <span className="w-12 flex-shrink-0 font-mono">{fmtHora(p.created_at)}</span>
                    <span className="w-20 flex-shrink-0 font-semibold text-neutral-900">R$ {p.valor.toFixed(2)}</span>
                    <span className="flex-1">{p.nome_pagador || '—'}</span>
                    <span className="flex-shrink-0 text-neutral-400">{p.forma_pagamento || '—'}</span>
                  </div>
                ))}
                {parcelas && parcelas.length === 0 && (
                  <p className="text-xs text-neutral-400">Nenhuma parcela encontrada.</p>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function TimelinePedido({ venda }: { venda: VendaSessao }) {
  const etapas: { label: string; horario: string | null }[] = [
    { label: 'Pedido feito', horario: venda.criadoEm },
    { label: 'Pronto', horario: venda.prontoEm },
    { label: 'Entregue', horario: venda.entregueEm },
    { label: 'Pago', horario: venda.pagoEm },
  ]
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      {etapas.map((etapa) => (
        <div key={etapa.label}>
          <p className="text-neutral-400">{etapa.label}</p>
          <p className="font-medium text-neutral-800">{etapa.horario ? fmtHora(etapa.horario) : '—'}</p>
        </div>
      ))}
    </div>
  )
}
