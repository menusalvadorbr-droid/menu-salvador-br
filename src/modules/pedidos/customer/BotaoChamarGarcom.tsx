'use client'

import { useState } from 'react'
import { chamarGarcom } from '../chamarGarcomRepository'

export default function BotaoChamarGarcom({
  estabelecimentoId,
  mesa,
  temCarrinho,
}: {
  estabelecimentoId: string
  mesa: string
  temCarrinho: boolean
}) {
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function handleChamar() {
    setEnviando(true)
    try {
      await chamarGarcom(estabelecimentoId, mesa)
      setEnviado(true)
      setTimeout(() => setEnviado(false), 8000)
    } catch (err) {
      alert(`Não foi possível chamar o garçom agora: ${err instanceof Error ? err.message : 'tente novamente'}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <button
      onClick={handleChamar}
      disabled={enviando || enviado}
      className={`fixed bottom-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition ${
        temCarrinho ? 'left-6' : 'left-1/2 -translate-x-1/2'
      } ${enviado ? 'bg-green-100 text-green-700' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
    >
      {enviado ? '✅ Garçom chamado!' : '🔔 Chamar garçom'}
    </button>
  )
}
