'use client'

import { useState } from 'react'
import { useInsumos } from '../hooks/useInsumos'
import { useMovimentos } from '../hooks/useMovimentos'
import type { TipoMovimentoEstoque } from '../types'

// 'saida_venda' fica de fora do formulário de propósito — é gravado
// automaticamente por baixarEstoquePorItens a cada pedido, nunca lançado
// manualmente (mas aparece no histórico abaixo igual aos outros).
const TIPOS_LANCAVEIS: { valor: Exclude<TipoMovimentoEstoque, 'saida_venda'>; label: string }[] = [
  { valor: 'entrada', label: '📥 Entrada' },
  { valor: 'saida_manual', label: '📤 Saída manual' },
  { valor: 'perda', label: '💔 Perda' },
  { valor: 'cortesia', label: '🎁 Cortesia' },
  { valor: 'ajuste_inventario', label: '📋 Ajuste de inventário' },
]

const LABEL_TIPO: Record<TipoMovimentoEstoque, string> = {
  entrada: '📥 Entrada',
  saida_manual: '📤 Saída manual',
  saida_venda: '🧾 Venda',
  perda: '💔 Perda',
  cortesia: '🎁 Cortesia',
  ajuste_inventario: '📋 Ajuste de inventário',
}

const MOTIVO_OBRIGATORIO: TipoMovimentoEstoque[] = ['perda', 'cortesia', 'ajuste_inventario']

const FORM_VAZIO = {
  insumoId: '',
  tipo: 'entrada' as Exclude<TipoMovimentoEstoque, 'saida_venda'>,
  quantidade: '',
  motivo: '',
}

export default function MovimentosManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { insumos, carregando: carregandoInsumos } = useInsumos(estabelecimentoId)
  const { movimentos, carregando: carregandoMovimentos, erro, lancar } = useMovimentos(estabelecimentoId)
  const [form, setForm] = useState(FORM_VAZIO)
  const [enviando, setEnviando] = useState(false)

  const motivoObrigatorio = MOTIVO_OBRIGATORIO.includes(form.tipo)

  async function handleLancar() {
    if (!form.insumoId || !form.quantidade.trim()) return
    setEnviando(true)
    const ok = await lancar({
      insumoId: form.insumoId,
      tipo: form.tipo,
      quantidade: Number(form.quantidade.replace(',', '.')) || 0,
      motivo: form.motivo.trim() || null,
    })
    setEnviando(false)
    if (ok) setForm(FORM_VAZIO)
  }

  if (carregandoInsumos || carregandoMovimentos) {
    return <div className="py-12 text-center text-neutral-400">Carregando movimentos...</div>
  }

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-semibold text-neutral-700">Lançar movimento</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Insumo
            <select
              value={form.insumoId}
              onChange={(e) => setForm((f) => ({ ...f, insumoId: e.target.value }))}
              className="w-48 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Selecione</option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Tipo
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as typeof f.tipo }))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              {TIPOS_LANCAVEIS.map((t) => (
                <option key={t.valor} value={t.valor}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Quantidade
            <input
              type="text"
              inputMode="decimal"
              value={form.quantidade}
              onChange={(e) => setForm((f) => ({ ...f, quantidade: e.target.value }))}
              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Motivo {motivoObrigatorio ? <span className="text-red-500">*</span> : <span>(opcional)</span>}
          <textarea
            value={form.motivo}
            onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
            rows={2}
            placeholder={motivoObrigatorio ? 'Obrigatório pra esse tipo de movimento' : 'Opcional'}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          onClick={handleLancar}
          disabled={enviando || !form.insumoId || !form.quantidade.trim() || (motivoObrigatorio && !form.motivo.trim())}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {enviando ? 'Lançando...' : 'Lançar movimento'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Insumo</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Quantidade</th>
              <th className="px-4 py-2">Motivo</th>
              <th className="px-4 py-2">Quem lançou</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {movimentos.map((mov) => (
              <tr key={mov.id}>
                <td className="px-4 py-2 text-neutral-500">
                  {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-2 text-neutral-900">{mov.insumo?.nome || '—'}</td>
                <td className="px-4 py-2 text-neutral-700">{LABEL_TIPO[mov.tipo]}</td>
                <td className="px-4 py-2 text-neutral-700">
                  {mov.quantidade} {mov.insumo?.unidade}
                </td>
                <td className="px-4 py-2 text-neutral-500">{mov.motivo || '—'}</td>
                <td className="px-4 py-2 text-neutral-500">{mov.nomeCriador || '—'}</td>
              </tr>
            ))}
            {movimentos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Nenhum movimento lançado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
