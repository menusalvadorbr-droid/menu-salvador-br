'use client'

import { useState, useTransition } from 'react'
import { alternarSecao, reordenarSecao } from './actions'

export interface SecaoConfig {
  id: string
  chave: string
  label: string
  ativa: boolean
  ordem: number
}

export default function SecoesEstabelecimentoForm({ secoesIniciais }: { secoesIniciais: SecaoConfig[] }) {
  const [secoes, setSecoes] = useState(
    [...secoesIniciais].sort((a, b) => a.ordem - b.ordem)
  )
  const [isPending, startTransition] = useTransition()

  function toggle(secao: SecaoConfig) {
    setSecoes((prev) => prev.map((s) => (s.id === secao.id ? { ...s, ativa: !s.ativa } : s)))
    startTransition(async () => {
      await alternarSecao(secao.id, !secao.ativa)
    })
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= secoes.length) return

    const novaLista = [...secoes]
    ;[novaLista[index], novaLista[alvo]] = [novaLista[alvo], novaLista[index]]
    setSecoes(novaLista)

    startTransition(async () => {
      await Promise.all(
        novaLista.map((s, i) => reordenarSecao(s.id, i))
      )
    })
  }

  if (secoes.length === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Nenhuma seção cadastrada ainda. É preciso popular a tabela{' '}
        <code className="rounded bg-neutral-100 px-1">secoes_estabelecimento_config</code>.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {secoes.map((secao, i) => (
        <div
          key={secao.id}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2"
        >
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => mover(i, -1)}
              disabled={i === 0 || isPending}
              className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
              aria-label="Mover para cima"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => mover(i, 1)}
              disabled={i === secoes.length - 1 || isPending}
              className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
              aria-label="Mover para baixo"
            >
              ▼
            </button>
          </div>

          <span className={`flex-1 text-sm ${secao.ativa ? 'text-neutral-900' : 'text-neutral-400'}`}>
            {secao.label}
          </span>

          <button
            type="button"
            onClick={() => toggle(secao)}
            disabled={isPending}
            className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
              secao.ativa ? 'bg-green-500' : 'bg-neutral-300'
            }`}
            aria-pressed={secao.ativa}
            aria-label={`Ativar ou desativar seção ${secao.label}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                secao.ativa ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  )
}
