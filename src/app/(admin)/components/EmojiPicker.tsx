'use client'

import { useState, useRef, useEffect } from 'react'

const SUGESTOES = [
  '🍽️', '🍺', '🥪', '☕', '🚚', '🫘', '🍔', '🥩', '🍰', '🍕',
  '🍦', '🍜', '🍣', '🌮', '🥗', '🍱', '🍗', '🍷', '🍹', '🧋',
  '🥘', '🍝', '🥟', '🍩', '🎂', '🧁', '🥙', '🍤', '🦐', '🥞',
  '📍', '🏪', '🏙️', '🌊', '⛱️', '🌴',
]

/**
 * Campo de ícone com um seletor rápido de emojis sugeridos, além do
 * texto livre normal — a maioria das pessoas não sabe (ou não lembra)
 * o atalho de teclado do emoji do sistema operacional.
 */
export default function EmojiPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (novoValor: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🍽️"
          className="w-12 rounded-lg border border-neutral-200 bg-white px-1 py-2 text-center text-lg"
        />
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          className="rounded-lg border border-neutral-200 bg-white px-1.5 py-2 text-xs text-neutral-500 hover:bg-neutral-50"
          title="Escolher emoji"
        >
          😀
        </button>
      </div>

      {aberto && (
        <div className="absolute z-20 mt-1 grid w-60 grid-cols-8 gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          {SUGESTOES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji)
                setAberto(false)
              }}
              className="rounded p-1 text-lg hover:bg-neutral-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
