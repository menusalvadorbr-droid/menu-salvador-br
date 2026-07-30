'use client'

import { useState } from 'react'

/**
 * Cartão com cabeçalho clicável que expande/recolhe o conteúdo — cada
 * instância guarda seu próprio estado (não é "abas": dá pra abrir mais
 * de uma seção ao mesmo tempo). Usado onde uma página do admin tem
 * várias seções grandes empilhadas (ex: Traduções da interface, Tipos e
 * bairros) e mostrar tudo aberto de uma vez fica pesado de rolar.
 */
export default function AdminAcordeaoSecao({
  titulo,
  contador,
  abertoInicialmente = false,
  children,
}: {
  titulo: string
  contador?: string
  abertoInicialmente?: boolean
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(abertoInicialmente)

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-neutral-800">{titulo}</span>
        <span className="flex flex-shrink-0 items-center gap-3">
          {contador && <span className="text-xs text-neutral-400">{contador}</span>}
          <span
            aria-hidden
            className={`text-neutral-400 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </span>
      </button>
      {aberto && <div className="border-t border-neutral-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}
