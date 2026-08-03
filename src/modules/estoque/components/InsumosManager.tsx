'use client'

import { useState } from 'react'
import { useInsumos } from '../hooks/useInsumos'
import type { UnidadeInsumo, Insumo } from '../types'
import type { DadosInsumo } from '../estoqueRepository'

const UNIDADES: UnidadeInsumo[] = ['un', 'kg', 'g', 'l', 'ml']

const FORM_VAZIO = {
  nome: '',
  unidade: 'un' as UnidadeInsumo,
  estoqueAtual: '',
  estoqueMinimo: '',
  custoUnitario: '',
  validadeDiasAlerta: '',
  alergenoIds: [] as string[],
  equivalenciaQtd: '',
  equivalenciaUnidade: '' as UnidadeInsumo | '',
}

export default function InsumosManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { insumos, alergenos, carregando, emFalta, adicionar, atualizar, ajustar, remover, listarAlergenosDoInsumo } =
    useInsumos(estabelecimentoId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [enviando, setEnviando] = useState(false)

  function fecharForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  function toggleAlergeno(id: string) {
    setForm((prev) => ({
      ...prev,
      alergenoIds: prev.alergenoIds.includes(id) ? prev.alergenoIds.filter((a) => a !== id) : [...prev.alergenoIds, id],
    }))
  }

  async function iniciarEdicao(insumo: Insumo) {
    setEditandoId(insumo.id)
    setMostrarForm(true)
    const alergenosDoInsumo = await listarAlergenosDoInsumo(insumo.id)
    setForm({
      nome: insumo.nome,
      unidade: insumo.unidade,
      estoqueAtual: String(insumo.estoque_atual),
      estoqueMinimo: String(insumo.estoque_minimo),
      custoUnitario: String(insumo.custo_unitario).replace('.', ','),
      validadeDiasAlerta: insumo.validade_dias_alerta != null ? String(insumo.validade_dias_alerta) : '',
      alergenoIds: alergenosDoInsumo.map((a) => a.id),
      equivalenciaQtd: insumo.equivalencia_qtd != null ? String(insumo.equivalencia_qtd).replace('.', ',') : '',
      equivalenciaUnidade: insumo.equivalencia_unidade || '',
    })
  }

  async function handleSalvar() {
    if (!form.nome.trim()) return
    setEnviando(true)
    const dados: DadosInsumo = {
      nome: form.nome.trim(),
      unidade: form.unidade,
      estoqueAtual: Number(form.estoqueAtual) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      custoUnitario: parseFloat(form.custoUnitario.replace(',', '.')) || 0,
      validadeDiasAlerta: form.validadeDiasAlerta.trim() ? Number(form.validadeDiasAlerta) : null,
      alergenoIds: form.alergenoIds,
      equivalenciaQtd:
        form.equivalenciaUnidade && form.equivalenciaQtd.trim()
          ? parseFloat(form.equivalenciaQtd.replace(',', '.')) || null
          : null,
      equivalenciaUnidade: form.equivalenciaUnidade || null,
    }
    try {
      if (editandoId) {
        await atualizar(editandoId, dados)
      } else {
        await adicionar(dados)
      }
      fecharForm()
    } finally {
      setEnviando(false)
    }
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
          onClick={() => (mostrarForm ? fecharForm() : setMostrarForm(true))}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo insumo'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 space-y-3 rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-700">{editandoId ? 'Editar insumo' : 'Novo insumo'}</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Nome
              <input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Queijo mussarela"
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Unidade
              <select
                value={form.unidade}
                onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value as UnidadeInsumo }))}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
            {!editandoId && (
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Estoque atual
                <input
                  type="number"
                  value={form.estoqueAtual}
                  onChange={(e) => setForm((f) => ({ ...f, estoqueAtual: e.target.value }))}
                  className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>
            )}
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Estoque mínimo
              <input
                type="number"
                value={form.estoqueMinimo}
                onChange={(e) => setForm((f) => ({ ...f, estoqueMinimo: e.target.value }))}
                className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Custo por {form.unidade}
              <input
                type="text"
                inputMode="decimal"
                value={form.custoUnitario}
                onChange={(e) => setForm((f) => ({ ...f, custoUnitario: e.target.value }))}
                placeholder="Ex: 3,50"
                className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Alerta de validade (dias)
              <input
                type="number"
                value={form.validadeDiasAlerta}
                onChange={(e) => setForm((f) => ({ ...f, validadeDiasAlerta: e.target.value }))}
                placeholder="Opcional"
                className="w-32 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
              />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">
              Equivalência <span className="font-normal text-neutral-400">(opcional — só é preciso se alguma ficha técnica for usar esse insumo numa unidade diferente da de cima, ex: comprado em unidade mas usado em gramas)</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              1 {form.unidade} equivale a
              <input
                type="text"
                inputMode="decimal"
                value={form.equivalenciaQtd}
                onChange={(e) => setForm((f) => ({ ...f, equivalenciaQtd: e.target.value }))}
                placeholder="Ex: 50"
                className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
              />
              <select
                value={form.equivalenciaUnidade}
                onChange={(e) => setForm((f) => ({ ...f, equivalenciaUnidade: e.target.value as UnidadeInsumo | '' }))}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
              >
                <option value="">nenhuma</option>
                {UNIDADES.filter((u) => u !== form.unidade).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">Alérgenos</label>
            <div className="flex flex-wrap gap-2">
              {alergenos.map((a) => {
                const sel = form.alergenoIds.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAlergeno(a.id)}
                    className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition ${
                      sel ? 'border-red-400 bg-red-50 text-red-700' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {a.icone && <span className="text-sm leading-none">{a.icone}</span>}
                    {a.nome}
                    {sel && <span className="ml-0.5 text-xs text-red-500">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleSalvar}
            disabled={enviando || !form.nome.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">Estoque atual</th>
              <th className="px-4 py-2">Mínimo</th>
              <th className="px-4 py-2">Custo unitário</th>
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
                    {insumo.equivalencia_qtd != null && insumo.equivalencia_unidade && (
                      <span className="ml-1 text-xs text-neutral-400">
                        (1 {insumo.unidade} = {insumo.equivalencia_qtd} {insumo.equivalencia_unidade})
                      </span>
                    )}
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
                  <td className="px-4 py-2 text-neutral-500">
                    R$ {insumo.custo_unitario.toFixed(2)} / {insumo.unidade}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => iniciarEdicao(insumo)} className="text-xs text-neutral-500 hover:underline">
                      Editar
                    </button>{' '}
                    <button
                      onClick={() => confirm(`Remover ${insumo.nome}?`) && remover(insumo.id)}
                      className="ml-2 text-xs text-red-500 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              )
            })}
            {insumos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
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
