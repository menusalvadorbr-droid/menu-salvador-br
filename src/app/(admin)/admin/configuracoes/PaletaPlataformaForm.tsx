'use client'

import { useState, useTransition } from 'react'
import { salvarPaleta } from './actions'

export default function PaletaPlataformaForm({
  corPrimariaInicial,
  corSecundariaInicial,
}: {
  corPrimariaInicial: string
  corSecundariaInicial: string
}) {
  const [corPrimaria, setCorPrimaria] = useState(corPrimariaInicial)
  const [corSecundaria, setCorSecundaria] = useState(corSecundariaInicial)
  const [salvo, setSalvo] = useState(false)
  const [isPending, startTransition] = useTransition()

  function salvar() {
    startTransition(async () => {
      await salvarPaleta(corPrimaria, corSecundaria)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3">
          <input
            type="color"
            value={corPrimaria}
            onChange={(e) => setCorPrimaria(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-neutral-200"
          />
          <span className="text-sm text-neutral-700">
            Primária
            <span className="block text-xs text-neutral-400">{corPrimaria}</span>
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="color"
            value={corSecundaria}
            onChange={(e) => setCorSecundaria(e.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-neutral-200"
          />
          <span className="text-sm text-neutral-700">
            Secundária
            <span className="block text-xs text-neutral-400">{corSecundaria}</span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={isPending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
        >
          {isPending ? 'Salvando...' : 'Salvar paleta'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
      </div>
    </div>
  )
}
