'use client'

import type { ReactNode } from 'react'

const ESTILOS_TEMA = {
  escuro: {
    overlay: 'bg-black/60',
    card: 'border-neutral-800 bg-neutral-900',
    titulo: 'text-white',
    descricao: 'text-neutral-400',
    cancelar: 'border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700',
  },
  claro: {
    overlay: 'bg-black/40',
    card: 'border-neutral-200 bg-white',
    titulo: 'text-neutral-900',
    descricao: 'text-neutral-500',
    cancelar: 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100',
  },
} as const

const ESTILOS_TOM = {
  padrao: 'bg-emerald-600 hover:bg-emerald-500',
  perigo: 'bg-red-600 hover:bg-red-500',
  atencao: 'bg-amber-600 hover:bg-amber-500',
  info: 'bg-sky-600 hover:bg-sky-500',
} as const

/**
 * Confirmação genérica pra ações sensíveis (fechar sessão de caixa,
 * registrar sangria/suprimento, remover insumo/fornecedor/mesa, cancelar
 * pedido de compra) — evita clique acidental em algo que não tem
 * "desfazer". Antes só existia dentro do módulo financeiro, hardcoded pro
 * tema escuro do Caixa (que também era escuro); a paleta do Caixa foi
 * unificada com o resto do painel (claro), então `tema="escuro"` continua
 * existindo como opção reutilizável mas não tem mais nenhum consumidor
 * hoje. Default `tema="claro"`.
 */
export default function ConfirmarAcaoModal({
  titulo,
  descricao,
  confirmarLabel = 'Confirmar',
  tom = 'padrao',
  tema = 'claro',
  enviando,
  onCancelar,
  onConfirmar,
}: {
  titulo: string
  descricao: ReactNode
  confirmarLabel?: string
  tom?: 'padrao' | 'perigo' | 'atencao' | 'info'
  tema?: 'claro' | 'escuro'
  enviando?: boolean
  onCancelar: () => void
  onConfirmar: () => void
}) {
  const t = ESTILOS_TEMA[tema]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${t.overlay}`} onClick={onCancelar} />
      <div className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${t.card}`}>
        <h3 className={`text-base font-bold ${t.titulo}`}>{titulo}</h3>
        <div className={`mt-2 text-sm ${t.descricao}`}>{descricao}</div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition disabled:opacity-40 ${t.cancelar}`}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={enviando}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-40 ${ESTILOS_TOM[tom]}`}
          >
            {enviando ? 'Aguarde...' : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
