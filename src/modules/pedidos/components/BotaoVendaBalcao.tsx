'use client'

import { useState } from 'react'
import LancarPedidoGarcom from '../garcom/LancarPedidoGarcom'

export default function BotaoVendaBalcao({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
      >
        🧾 Venda no balcão
      </button>

      {aberto && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={null}
          onFechar={() => setAberto(false)}
          onPedidoLancado={() => setAberto(false)}
        />
      )}
    </>
  )
}
