'use client'

import { useState, useTransition } from 'react'
import { salvarSecoes } from './actions'

export interface SecaoConfig {
  chave: string
  label: string
  ativa: boolean
  ordem: number
}

const SECOES_PADRAO: SecaoConfig[] = [
  { chave: 'capa', label: 'Capa', ativa: true, ordem: 0 },
  { chave: 'sobre', label: 'Sobre', ativa: true, ordem: 1 },
  { chave: 'cardapio_destaque', label: 'Cardápio em destaque', ativa: true, ordem: 2 },
  { chave: 'galeria', label: 'Galeria de fotos', ativa: true, ordem: 3 },
  { chave: 'horarios', label: 'Horários de funcionamento', ativa: true, ordem: 4 },
  { chave: 'localizacao', label: 'Localização', ativa: true, ordem: 5 },
  { chave: 'comodidades', label: 'Comodidades (pet, estacionamento, acessibilidade)', ativa: true, ordem: 6 },
  { chave: 'avaliacoes_google', label: 'Avaliações do Google', ativa: false, ordem: 7 },
  { chave: 'contato', label: 'Contato / redes sociais', ativa: true, ordem: 8 },
  { chave: 'promocoes', label: 'Promoções ativas', ativa: true, ordem: 9 },
]

export default function SecoesEstabelecimentoForm({ secoesIniciais }: { secoesIniciais: SecaoConfig[] }) {
  const [secoes, setSecoes] = useState(
    [...(secoesIniciais.length > 0 ? secoesIniciais : SECOES_PADRAO)].sort((a, b) => a.ordem - b.ordem)
  )
  const [isPending, startTransition] = useTransition()
  const [salvo, setSalvo] = useState(false)

  function persistir(novaLista: SecaoConfig[]) {
    const comOrdemAtualizada = novaLista.map((s, i) => ({ ...s, ordem: i }))
    setSecoes(comOrdemAtualizada)
    startTransition(async () => {
      await salvarSecoes(comOrdemAtualizada)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    })
  }

  function toggle(chave: string) {
    persistir(secoes.map((s) => (s.chave === chave ? { ...s, ativa: !s.ativa } : s)))
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= secoes.length) return
    const novaLista = [...secoes]
    ;[novaLista[index], novaLista[alvo]] = [novaLista[alvo], novaLista[index]]
    persistir(novaLista)
  }

  return (
    <div className="flex flex-col gap-2">
      {secoes.map((secao, i) => (
        <div
          key={secao.chave}
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
            onClick={() => toggle(secao.chave)}
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
      {salvo && <span className="text-xs text-green-600">Salvo ✓</span>}
    </div>
  )
}
