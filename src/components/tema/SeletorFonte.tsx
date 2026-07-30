'use client'

import { useEffect, useRef, useState } from 'react'
import { FONTES_TEMA, obterFonteTema } from '@/lib/fontesTema'

/**
 * Dropdown custom (não um <select> nativo) — cada opção precisa
 * renderizar na própria fonte que representa, e a lista de opções de um
 * <select> nativo não aceita estilização confiável entre navegadores.
 * Botões numa lista dão controle total sobre a fonte de cada linha.
 */
export default function SeletorFonte({
  valor,
  onChange,
  disabled,
}: {
  valor: string
  onChange: (nome: string) => void
  disabled?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const atual = obterFonteTema(valor)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [aberto])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        disabled={disabled}
        aria-expanded={aberto}
        className={`flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 ${
          disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'
        }`}
      >
        <span className={atual.className}>{atual.nome}</span>
        <span className={`text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {aberto && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {FONTES_TEMA.map((fonte) => (
            <button
              key={fonte.nome}
              type="button"
              onClick={() => {
                onChange(fonte.nome)
                setAberto(false)
              }}
              className={`block w-full px-3 py-2 text-left text-base transition hover:bg-orange-50 ${fonte.className} ${
                fonte.nome === valor ? 'bg-orange-50 text-orange-700' : 'text-gray-800'
              }`}
            >
              {fonte.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
