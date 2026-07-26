'use client'

import { useSincronizacaoPedidos } from '../hooks/useSincronizacaoPedidos'

export default function StatusConexaoPedidos() {
  const { pendentes, sincronizando } = useSincronizacaoPedidos()

  if (pendentes === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-lg">
      {sincronizando
        ? '🔄 Sincronizando pedido salvo localmente...'
        : `⚠️ ${pendentes} pedido(s) salvo(s) localmente, aguardando conexão`}
    </div>
  )
}
