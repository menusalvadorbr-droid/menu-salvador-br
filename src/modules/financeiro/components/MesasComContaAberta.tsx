'use client'

import { useState } from 'react'
import { useMesas } from '@/modules/pedidos/mesas/hooks/useMesas'
import FecharContaMesaModal from '@/modules/pedidos/mesas/components/FecharContaMesaModal'
import type { Mesa } from '@/modules/pedidos/mesas/types'
import { caixaTema } from '../caixaTema'

/**
 * Segundo ponto de entrada pro fechamento de conta por mesa (o primeiro é
 * o mapa de mesas) — direto de dentro do Caixa, sem precisar navegar até
 * lá só pra fechar a comanda de quem já está pagando.
 */
export default function MesasComContaAberta({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { mesas, carregando } = useMesas(estabelecimentoId)
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)
  const [busca, setBusca] = useState('')

  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada')
  const mesasFiltradas = busca.trim()
    ? mesasOcupadas.filter((m) => m.numero.toLowerCase().includes(busca.trim().toLowerCase()))
    : mesasOcupadas

  if (carregando || mesasOcupadas.length === 0) return null

  return (
    <div className={`${caixaTema.painel} p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-900">🍽️ Mesas com conta aberta</p>
        {mesasOcupadas.length > 4 && (
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar mesa…"
            className={`w-32 text-sm ${caixaTema.input}`}
          />
        )}
      </div>
      {mesasFiltradas.length === 0 ? (
        <p className="py-4 text-center text-xs text-neutral-500">Nenhuma mesa encontrada pra &quot;{busca}&quot;.</p>
      ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {mesasFiltradas.map((mesa) => (
          <button
            key={mesa.id}
            onClick={() => setMesaSelecionada(mesa)}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center transition hover:border-amber-300 hover:bg-amber-100"
          >
            <div className="text-lg font-bold text-amber-800">{mesa.numero}</div>
            <div className="mt-0.5 text-xs font-medium text-amber-700">💳 Fechar conta</div>
          </button>
        ))}
      </div>
      )}

      {mesaSelecionada && (
        <FecharContaMesaModal
          estabelecimentoId={estabelecimentoId}
          mesa={mesaSelecionada}
          onFechar={() => setMesaSelecionada(null)}
          onContaFechada={() => setMesaSelecionada(null)}
        />
      )}
    </div>
  )
}
