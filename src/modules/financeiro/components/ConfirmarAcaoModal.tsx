'use client'

import type { ReactNode } from 'react'

/**
 * Confirmação genérica pra ações sensíveis da área de caixa (fechar
 * sessão, registrar sangria/suprimento) — evita clique acidental em algo
 * que não tem "desfazer". Visual consistente com o tema escuro do PDV.
 */
export default function ConfirmarAcaoModal({
  titulo,
  descricao,
  confirmarLabel = 'Confirmar',
  tom = 'padrao',
  enviando,
  onCancelar,
  onConfirmar,
}: {
  titulo: string
  descricao: ReactNode
  confirmarLabel?: string
  tom?: 'padrao' | 'perigo'
  enviando?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancelar} />
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
        <h3 className="text-base font-bold text-white">{titulo}</h3>
        <div className="mt-2 text-sm text-neutral-400">{descricao}</div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-700 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={enviando}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-40 ${
              tom === 'perigo' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {enviando ? 'Aguarde...' : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
