'use client'

import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Casca genérica dos modais de edição do espelho — um por seção
 * (Cabeçalho, Sobre, Contato, Comodidades, Horários, Galeria). Só
 * cabeçalho + fechar; cada modal cuida do próprio conteúdo e salvamento.
 */
export default function ModalPerfil({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">{titulo}</h3>
          <button onClick={onFechar} className="text-neutral-400 hover:text-neutral-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
