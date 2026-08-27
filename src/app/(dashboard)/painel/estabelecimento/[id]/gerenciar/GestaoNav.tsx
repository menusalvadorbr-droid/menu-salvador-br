'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ITENS } from './ModuloGestao'

const TEMAS = {
  claro: {
    barra: 'border-neutral-100 bg-white',
    ativo: 'bg-neutral-900 text-white',
    inativo: 'text-neutral-600 hover:bg-neutral-50',
  },
  escuro: {
    barra: 'border-neutral-800 bg-neutral-900',
    ativo: 'bg-emerald-600 text-white',
    inativo: 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100',
  },
} as const

/** Barra de navegação persistente entre as telas de Gestão — troca de tela
 *  com um clique, sem voltar pro hub (ModuloGestao.tsx, que continua como
 *  ponto de entrada vindo de fora do módulo). Mesmos ícones/rótulos de
 *  ITENS, exportado de lá pra não duplicar a lista. */
export default function GestaoNav({
  estabelecimentoId,
  tema = 'claro',
}: {
  estabelecimentoId: string
  tema?: 'claro' | 'escuro'
}) {
  const pathname = usePathname()
  const c = TEMAS[tema]

  return (
    <nav className={`mt-3 flex gap-1 overflow-x-auto rounded-xl border p-1 ${c.barra}`}>
      {ITENS.map((item) => {
        const href = `/painel/estabelecimento/${estabelecimentoId}/${item.slug}`
        const ativo = pathname?.startsWith(href)
        return (
          <Link
            key={item.slug}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              ativo ? c.ativo : c.inativo
            }`}
          >
            <item.Icone className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
