'use client'

import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Wrapper único e genérico pro "espelho clicável" do perfil — renderiza a
 * seção real (os mesmos componentes que a página pública usa) sem
 * modificar nada nela, e sobrepõe um ícone de lápis que só aparece no
 * hover (mesmo padrão já usado em GaleriaTab.tsx/GaleriaUpload.tsx pra
 * excluir foto). Um componente serve pra todas as seções — evita construir
 * uma variante de "modo edição" pra cada Secao*.tsx.
 */
export default function PontoEditavel({ onEditar, label, children }: { onEditar: () => void; label: string; children: ReactNode }) {
  return (
    <div className="group relative rounded-xl outline-2 outline-offset-4 outline-transparent transition hover:outline-orange-300">
      {children}
      <button
        onClick={onEditar}
        aria-label={`Editar ${label}`}
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar {label}
      </button>
    </div>
  )
}
