'use client'

import { useState } from 'react'
import { gerarCodigoPix } from '@/lib/pix/gerarCodigoPix'
import QrCodeEstilizado from '@/app/(dashboard)/painel/components/ui/QrCodeEstilizado'

export default function PixPagamentoCard({
  chavePix,
  nomeFantasia,
  cidade,
  valor,
  codigoPedido,
}: {
  chavePix: string | null
  nomeFantasia: string
  cidade: string | null
  valor: number
  codigoPedido: string
}) {
  const [copiado, setCopiado] = useState(false)

  if (!chavePix || !cidade) return null

  const pix = gerarCodigoPix({ chavePix, nomeRecebedor: nomeFantasia, cidade, valor, codigoPedido })
  if (!pix) return null

  function copiar() {
    navigator.clipboard.writeText(pix!.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-sm">
      <p className="mb-3 text-sm font-bold text-neutral-900">💳 Pague com Pix para confirmar seu pedido</p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <QrCodeEstilizado data={pix.copiaCola} width={160} height={160} />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs text-neutral-500">
            Escaneie com o app do seu banco ou copie o código abaixo (&quot;copia e cola&quot;).
          </p>
          <textarea
            readOnly
            value={pix.copiaCola}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-600"
          />
          <button
            onClick={copiar}
            className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 sm:w-auto"
          >
            {copiado ? 'Copiado!' : 'Copiar código Pix'}
          </button>
        </div>
      </div>
    </div>
  )
}
