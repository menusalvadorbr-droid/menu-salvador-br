'use client'

import { useState, useTransition } from 'react'
import { criarPropaganda, alternarPropaganda, removerPropaganda } from './actions'

export interface Propaganda {
  id: string
  titulo: string
  descricao: string | null
  imagem: string | null
  link: string | null
  ativa: boolean
  data_inicio: string | null
  data_fim: string | null
}

function calcularStatus(p: Propaganda): { label: string; cor: string } {
  if (!p.ativa) return { label: '⚪ Desativada', cor: 'text-neutral-400' }

  const agora = new Date()
  if (p.data_inicio && new Date(p.data_inicio) > agora) {
    return { label: '⏳ Agendada', cor: 'text-amber-600' }
  }
  if (p.data_fim && new Date(p.data_fim) < agora) {
    return { label: '⏹️ Expirada', cor: 'text-neutral-400' }
  }
  return { label: '🟢 Ativa agora', cor: 'text-green-600' }
}

export default function PropagandasManager({ propagandasIniciais }: { propagandasIniciais: Propaganda[] }) {
  const [propagandas, setPropagandas] = useState(propagandasIniciais)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggle(p: Propaganda) {
    setPropagandas((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativa: !x.ativa } : x)))
    startTransition(async () => {
      await alternarPropaganda(p.id, !p.ativa)
    })
  }

  function remover(id: string) {
    if (!confirm('Remover esta propaganda?')) return
    setPropagandas((prev) => prev.filter((x) => x.id !== id))
    startTransition(async () => {
      await removerPropaganda(id)
    })
  }

  async function handleSubmit(formData: FormData) {
    await criarPropaganda(formData)
    setMostrarForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{propagandas.length} propagandas cadastradas</p>
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Nova propaganda'}
        </button>
      </div>

      {mostrarForm && (
        <form action={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4">
          <input
            name="titulo"
            placeholder="Título"
            required
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <textarea
            name="descricao"
            placeholder="Descrição curta"
            rows={2}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <input
            name="imagem"
            placeholder="URL da imagem"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <input
            name="link"
            placeholder="Link de destino"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Início (opcional)
              <input
                type="date"
                name="data_inicio"
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Fim (opcional)
              <input
                type="date"
                name="data_fim"
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>
          <button
            type="submit"
            className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
          >
            Criar
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {propagandas.map((p) => {
          const status = calcularStatus(p)
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
              {p.imagem && (
                <img src={p.imagem} alt={p.titulo} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{p.titulo}</p>
                <p className={`text-xs ${status.cor}`}>{status.label}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(p)}
                disabled={isPending}
                className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${
                  p.ativa ? 'bg-green-500' : 'bg-neutral-300'
                }`}
                aria-pressed={p.ativa}
                aria-label={`Ativar ou desativar ${p.titulo}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                    p.ativa ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => remover(p.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            </div>
          )
        })}
        {propagandas.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">Nenhuma propaganda cadastrada ainda.</p>
        )}
      </div>
    </div>
  )
}
