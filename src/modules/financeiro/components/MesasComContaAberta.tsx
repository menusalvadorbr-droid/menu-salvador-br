'use client'

import { useState } from 'react'
import { useMesas } from '@/modules/pedidos/mesas/hooks/useMesas'
import FecharContaMesaModal from '@/modules/pedidos/mesas/components/FecharContaMesaModal'
import type { Mesa } from '@/modules/pedidos/mesas/types'

/**
 * Segundo ponto de entrada pro fechamento de conta por mesa (o primeiro é
 * o mapa de mesas) — direto de dentro do Caixa, sem precisar navegar até
 * lá só pra fechar a comanda de quem já está pagando.
 */
export default function MesasComContaAberta({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { mesas, carregando } = useMesas(estabelecimentoId)
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)

  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada')

  if (carregando || mesasOcupadas.length === 0) return null

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-neutral-700">🍽️ Mesas com conta aberta</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {mesasOcupadas.map((mesa) => (
          <button
            key={mesa.id}
            onClick={() => setMesaSelecionada(mesa)}
            className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-center transition hover:border-orange-400"
          >
            <div className="text-lg font-bold text-orange-700">{mesa.numero}</div>
            <div className="mt-0.5 text-xs font-medium text-orange-600">💳 Fechar conta</div>
          </button>
        ))}
      </div>

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
