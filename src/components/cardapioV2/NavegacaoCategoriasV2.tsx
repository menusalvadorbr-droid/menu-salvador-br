'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

/**
 * Menu ☰ que abre a lista de categorias pra pular direto pra uma seção —
 * útil quando o cardápio tem muitas categorias e rolar a página inteira
 * fica longo. Só aparece com 2+ categorias (mesmo critério do V1 pra
 * mostrar navegação por categoria).
 */
export default function NavegacaoCategoriasV2({
  categorias,
  corPrimaria,
  corTexto,
}: {
  categorias: { id: string; nome: string }[]
  corPrimaria: string
  corTexto: string
}) {
  const [aberto, setAberto] = useState(false)

  if (categorias.length < 2) return null

  function irPara(id: string) {
    setAberto(false)
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir menu de categorias"
        aria-expanded={aberto}
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ color: corTexto }}
      >
        {aberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {aberto && (
        <>
          {/* Fecha ao clicar fora — camada invisível abaixo do painel */}
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-80 w-56 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => irPara(cat.id)}
                className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                style={{ color: corTexto }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: corPrimaria }} /> {' '}
                {cat.nome}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
