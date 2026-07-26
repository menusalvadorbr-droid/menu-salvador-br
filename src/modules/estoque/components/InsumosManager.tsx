'use client'

import { useState } from 'react'
import { useInsumos } from '../hooks/useInsumos'
import type { UnidadeInsumo } from '../types'

export default function InsumosManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { insumos, carregando, emFalta, adicionar, ajustar, remover } = useInsumos(estabelecimentoId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState<UnidadeInsumo>('un')
  const [estoqueAtual, setEstoqueAtual] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('')

  async function handleAdicionar() {
    if (!nome.trim()) return
    await adicionar(nome.trim(), unidade, Number(estoqueAtual) || 0, Number(estoqueMinimo) || 0)
    setNome('')
    setEstoqueAtual('')
    setEstoqueMinimo('')
    setMostrarForm(false)
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando insumos...</div>
  }

  return (
    <div>
      {emFalta.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ {emFalta.length} insumo(s) no estoque mínimo ou abaixo: {emFalta.map((i) => i.nome).join(', ')}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{insumos.length} insumos cadastrados</p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo insumo'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Queijo mussarela"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Unidade
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value as UnidadeInsumo)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="l">l</option>
              <option value="ml">ml</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Estoque atual
            <input
              type="number"
              value={estoqueAtual}
              onChange={(e) => setEstoqueAtual(e.target.value)}
              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Estoque mínimo
            <input
              type="number"
              value={estoqueMinimo}
              onChange={(e) => setEstoqueMinimo(e.target.value)}
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

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">Estoque atual</th>
              <th className="px-4 py-2">Mínimo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {insumos.map((insumo) => {
              const baixo = insumo.estoque_atual <= insumo.estoque_minimo
              return (
                <tr key={insumo.id} className={baixo ? 'bg-amber-50' : ''}>
                  <td className="px-4 py-2 text-neutral-900">
                    {baixo && '⚠️ '}
                    {insumo.nome}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={insumo.estoque_atual}
                      onBlur={(e) => ajustar(insumo.id, Number(e.target.value))}
                      className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-neutral-900"
                    />{' '}
                    <span className="text-xs text-neutral-400">{insumo.unidade}</span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500">
                    {insumo.estoque_minimo} {insumo.unidade}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => confirm(`Remover ${insumo.nome}?`) && remover(insumo.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              )
            })}
            {insumos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Nenhum insumo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
