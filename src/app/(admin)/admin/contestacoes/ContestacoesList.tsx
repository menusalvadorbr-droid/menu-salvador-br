'use client'

import { useState } from 'react'
import { transferirVinculo, descartarContestacao } from './actions'

interface Item {
  id: string
  justificativa: string
  criadoEm: string
  estabelecimentoId: string
  estabelecimentoNome: string
  donoAtualNome: string
  contestadorNome: string
  contestadorCpf: string
  contestadorContato: string
}

export default function ContestacoesList({ itensIniciais }: { itensIniciais: Item[] }) {
  const [itens, setItens] = useState(itensIniciais)
  const [processando, setProcessando] = useState<string | null>(null)

  async function transferir(item: Item) {
    if (!confirm(`Transferir "${item.estabelecimentoNome}" de ${item.donoAtualNome} para ${item.contestadorNome}?`)) return
    setProcessando(item.id)
    try {
      await transferirVinculo(item.id)
      setItens((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao transferir.')
    } finally {
      setProcessando(null)
    }
  }

  async function descartar(item: Item) {
    if (!confirm(`Descartar a contestação de ${item.contestadorNome} sobre "${item.estabelecimentoNome}"?`)) return
    setProcessando(item.id)
    try {
      await descartarContestacao(item.id)
      setItens((prev) => prev.filter((i) => i.id !== item.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao descartar.')
    } finally {
      setProcessando(null)
    }
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-sm text-neutral-400 shadow-sm">
        Nenhuma contestação pendente.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {itens.map((item) => (
        <div key={item.id} className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">{item.estabelecimentoNome}</p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Dono atual</p>
              <p className="mt-1 text-neutral-800">{item.donoAtualNome}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-400">Contestador</p>
              <p className="mt-1 text-neutral-800">{item.contestadorNome}</p>
              <p className="text-xs text-neutral-500">CPF: {item.contestadorCpf}</p>
              <p className="text-xs text-neutral-500">Contato: {item.contestadorContato}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-neutral-100 p-3 text-sm text-neutral-700">
            {item.justificativa}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => transferir(item)}
              disabled={processando === item.id}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Transferir pro contestador
            </button>
            <button
              onClick={() => descartar(item)}
              disabled={processando === item.id}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 disabled:opacity-50"
            >
              Descartar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
