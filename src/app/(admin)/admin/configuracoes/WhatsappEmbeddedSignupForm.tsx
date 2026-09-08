'use client'

import { useState, useTransition } from 'react'
import { salvarWhatsappEmbeddedSignupAtivado } from './actions'

export default function WhatsappEmbeddedSignupForm({ ativadoInicial }: { ativadoInicial: boolean }) {
  const [ativado, setAtivado] = useState(ativadoInicial)
  const [salvo, setSalvo] = useState(false)
  const [isPending, startTransition] = useTransition()

  function alternar() {
    const novo = !ativado
    setAtivado(novo)
    startTransition(async () => {
      await salvarWhatsappEmbeddedSignupAtivado(novo)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 select-none">
        <div
          role="switch"
          aria-checked={ativado}
          tabIndex={0}
          onClick={alternar}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              alternar()
            }
          }}
          className={`relative h-5 w-9 rounded-full transition-colors ${ativado ? 'bg-emerald-500' : 'bg-neutral-200'} ${
            isPending ? 'opacity-50' : 'cursor-pointer'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              ativado ? 'translate-x-4' : ''
            }`}
          />
        </div>
        <span className="text-sm font-medium text-neutral-700">
          {ativado ? 'Ativado — visível pros estabelecimentos' : 'Desativado — tela oculta'}
        </span>
      </label>
      {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
    </div>
  )
}
