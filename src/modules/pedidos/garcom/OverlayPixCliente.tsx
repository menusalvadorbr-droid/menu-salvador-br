'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { gerarCodigoPix } from '@/lib/pix/gerarCodigoPix'
import { formatarReais } from '@/lib/moeda'
import QrCodeEstilizado from '@/app/(dashboard)/painel/components/ui/QrCodeEstilizado'

/**
 * Tela cheia pensada pra virar o tablet/monitor pro cliente escanear —
 * inspirada no mockup caixa-venda-balcao-mockup(2).html (overlay grande,
 * QR no centro, "aponte a câmera do banco"). Diferente de
 * PainelPixCobranca.tsx (card inline, sempre visível pro operador nas
 * telas de mesa/pedido avulso), aqui os controles do operador
 * ("Confirmei que o Pix caiu") ficam atrás de um olho — o operador abre já
 * vendo tudo, aperta o olho pra esconder antes de virar a tela pro
 * cliente, e aperta de novo depois pra confirmar o pagamento.
 */
export default function OverlayPixCliente({
  chavePix,
  nomeFantasia,
  cidade,
  valor,
  referencia,
  pixConfirmado,
  onPixConfirmadoChange,
  onFechar,
}: {
  chavePix: string | null
  nomeFantasia: string
  cidade: string | null
  valor: number
  referencia: string
  pixConfirmado: boolean
  onPixConfirmadoChange: (valor: boolean) => void
  onFechar: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const [controlesVisiveis, setControlesVisiveis] = useState(true)

  const txid = referencia.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'PEDIDO'
  const pix = chavePix && cidade ? gerarCodigoPix({ chavePix, nomeRecebedor: nomeFantasia, cidade, valor, codigoPedido: txid }) : null

  function copiar() {
    if (!pix) return
    navigator.clipboard.writeText(pix.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={() => setControlesVisiveis((v) => !v)}
          title={controlesVisiveis ? 'Ocultar controles antes de mostrar pro cliente' : 'Mostrar controles'}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
        >
          {controlesVisiveis ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 px-6 py-6 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-widest text-sky-100">Pagamento Pix</p>
          <p className="mt-1 text-4xl font-black tracking-tight">R$ {formatarReais(valor)}</p>
          <p className="mt-1 text-sm text-sky-100">Aponte a câmera do banco para o QR Code</p>
        </div>

        <div className="flex flex-col items-center px-6 py-6">
          {pix ? (
            <>
              <div className="rounded-2xl border-4 border-sky-100 bg-white p-3 shadow-inner">
                <QrCodeEstilizado data={pix.copiaCola} width={220} height={220} />
              </div>
              <p className="mt-4 text-center text-sm text-neutral-600">
                Ou use <strong>Pix copia e cola</strong> no app do seu banco
              </p>
              <div className="mt-3 flex w-full gap-2">
                <input
                  readOnly
                  value={pix.copiaCola}
                  className="min-w-0 flex-1 truncate rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-[11px] text-neutral-700"
                />
                <button
                  type="button"
                  onClick={copiar}
                  className="shrink-0 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="mt-5 flex w-full items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs text-neutral-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                Aguardando pagamento…
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              ⚠️ Pix não configurado — configure em Configurações → WhatsApp/Pix.
            </p>
          )}
        </div>

        {controlesVisiveis && (
          <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={pixConfirmado}
                onChange={(e) => onPixConfirmadoChange(e.target.checked)}
                className="h-4 w-4"
              />
              Confirmei que o Pix caiu
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Fechar
              </button>
            </div>
            <p className="text-center text-[10px] text-neutral-400">
              Esconda estes controles (ícone de olho acima) antes de virar a tela pro cliente
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
