'use client'

import { useState } from 'react'
import { useMesas } from '../hooks/useMesas'
import { ETIQUETA_STATUS_MESA, type Mesa } from '../types'
import LancarPedidoGarcom from '../../garcom/LancarPedidoGarcom'
import FecharContaMesaModal from './FecharContaMesaModal'

export default function MapaMesas({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { mesas, carregando, adicionar, mudarStatus, remover } = useMesas(estabelecimentoId)
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)
  const [mesaFechandoConta, setMesaFechandoConta] = useState<Mesa | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [numeroNovo, setNumeroNovo] = useState('')
  const [capacidadeNova, setCapacidadeNova] = useState('')

  async function handleAdicionar() {
    if (!numeroNovo.trim()) return
    await adicionar(numeroNovo.trim(), capacidadeNova ? Number(capacidadeNova) : undefined)
    setNumeroNovo('')
    setCapacidadeNova('')
    setMostrarForm(false)
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando mesas...</div>
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{mesas.length} mesas cadastradas</p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Nova mesa'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Número/nome da mesa
            <input
              value={numeroNovo}
              onChange={(e) => setNumeroNovo(e.target.value)}
              placeholder="Ex: 12"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Capacidade (opcional)
            <input
              type="number"
              value={capacidadeNova}
              onChange={(e) => setCapacidadeNova(e.target.value)}
              placeholder="4"
              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <button
            onClick={handleAdicionar}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Adicionar
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mesas.map((mesa) => {
          const etiqueta = ETIQUETA_STATUS_MESA[mesa.status]
          return (
            <div
              key={mesa.id}
              className={`rounded-xl border p-4 text-center transition ${etiqueta.cor}`}
            >
              <button onClick={() => setMesaSelecionada(mesa)} className="w-full">
                <div className="text-2xl font-bold">{mesa.numero}</div>
                {mesa.capacidade && <div className="text-xs opacity-70">{mesa.capacidade} lugares</div>}
                <div className="mt-1 text-xs font-medium">{etiqueta.label}</div>
              </button>
              <div className="mt-2 flex justify-center gap-2 text-xs">
                <select
                  value={mesa.status}
                  onChange={(e) => mudarStatus(mesa.id, e.target.value as any)}
                  className="rounded border border-white/50 bg-white/60 px-1 py-0.5 text-xs"
                >
                  <option value="livre">Livre</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="reservada">Reservada</option>
                  <option value="fechada">Fechada</option>
                </select>
                {mesa.status === 'ocupada' && (
                  <button
                    onClick={() => setMesaFechandoConta(mesa)}
                    className="opacity-70 hover:opacity-100"
                    title="Fechar conta"
                  >
                    💳
                  </button>
                )}
                <button
                  onClick={() => confirm(`Remover mesa ${mesa.numero}?`) && remover(mesa.id)}
                  className="opacity-60 hover:opacity-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
        {mesas.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-neutral-400">
            Nenhuma mesa cadastrada ainda.
          </p>
        )}
      </div>

      {mesaSelecionada && (
        <LancarPedidoGarcom
          estabelecimentoId={estabelecimentoId}
          mesa={mesaSelecionada}
          onFechar={() => setMesaSelecionada(null)}
          onPedidoLancado={() => setMesaSelecionada(null)}
        />
      )}

      {mesaFechandoConta && (
        <FecharContaMesaModal
          estabelecimentoId={estabelecimentoId}
          mesa={mesaFechandoConta}
          onFechar={() => setMesaFechandoConta(null)}
          onContaFechada={() => setMesaFechandoConta(null)}
        />
      )}
    </div>
  )
}
