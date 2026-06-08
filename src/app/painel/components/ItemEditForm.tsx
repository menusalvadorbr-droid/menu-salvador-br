// src/app/painel/components/ItemEditForm.tsx
'use client'

import { useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { ImageUpload } from '@/components/upload/ImageUpload'

interface ItemEditFormProps {
  item: any
  onSave: (dados: any) => void
  onCancel: () => void
  idiomasAtivos: string[]
}

export function ItemEditForm({ item, onSave, onCancel, idiomasAtivos }: ItemEditFormProps) {
  const [form, setForm] = useState({
    nome: item.nome,
    nome_en: item.nome_en || '',
    nome_es: item.nome_es || '',
    preco: item.preco,
    preco_promocional: item.preco_promocional || '',
    descricao: item.descricao || '',
    descricao_en: item.descricao_en || '',
    descricao_es: item.descricao_es || '',
    tags: item.tags?.join(', ') || '',
    tags_en: item.tags_en?.join(', ') || '',
    tags_es: item.tags_es?.join(', ') || '',
    foto_url: item.foto_url || '',
    promocao_ativa: item.promocao_ativa,
    delivery_disponivel: item.delivery_disponivel || false,
    codigo: item.codigo || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dados = {
      nome: form.nome,
      nome_en: form.nome_en,
      nome_es: form.nome_es,
      preco: form.preco,
      preco_promocional: form.preco_promocional || null,
      descricao: form.descricao,
      descricao_en: form.descricao_en,
      descricao_es: form.descricao_es,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      tags_en: form.tags_en ? form.tags_en.split(',').map(t => t.trim()) : [],
      tags_es: form.tags_es ? form.tags_es.split(',').map(t => t.trim()) : [],
      foto_url: form.foto_url,
      promocao_ativa: form.promocao_ativa,
      delivery_disponivel: form.delivery_disponivel,
      codigo: form.codigo,
    }
    onSave(dados)
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-lg mb-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Código</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.codigo}
              onChange={e => setForm({ ...form, codigo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Preço (R$)</label>
            <NumericFormat
              value={form.preco}
              onValueChange={(values) => setForm({ ...form, preco: values.floatValue })}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="R$ 0,00"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium">Nome (PT) *</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.nome}
            onChange={e => setForm({ ...form, nome: e.target.value })}
            required
          />
        </div>

        {idiomasAtivos.includes('en') && (
          <div>
            <label className="text-xs font-medium">Nome (EN) 🇺🇸</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.nome_en}
              onChange={e => setForm({ ...form, nome_en: e.target.value })}
            />
          </div>
        )}
        {idiomasAtivos.includes('es') && (
          <div>
            <label className="text-xs font-medium">Nome (ES) 🇪🇸</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.nome_es}
              onChange={e => setForm({ ...form, nome_es: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Descrição (PT)</label>
          <textarea
            className="w-full border rounded px-2 py-1 text-sm"
            rows={3}
            value={form.descricao}
            onChange={e => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição do item..."
          />
        </div>

        {idiomasAtivos.includes('en') && (
          <div>
            <label className="text-xs font-medium">Descrição (EN) 🇺🇸</label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              rows={3}
              value={form.descricao_en}
              onChange={e => setForm({ ...form, descricao_en: e.target.value })}
            />
          </div>
        )}
        {idiomasAtivos.includes('es') && (
          <div>
            <label className="text-xs font-medium">Descrição (ES) 🇪🇸</label>
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              rows={3}
              value={form.descricao_es}
              onChange={e => setForm({ ...form, descricao_es: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium">Tags (PT)</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            placeholder="ex: vegetariano, sem lactose"
          />
        </div>

        {idiomasAtivos.includes('en') && (
          <div>
            <label className="text-xs font-medium">Tags (EN) 🇺🇸</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.tags_en}
              onChange={e => setForm({ ...form, tags_en: e.target.value })}
            />
          </div>
        )}
        {idiomasAtivos.includes('es') && (
          <div>
            <label className="text-xs font-medium">Tags (ES) 🇪🇸</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.tags_es}
              onChange={e => setForm({ ...form, tags_es: e.target.value })}
            />
          </div>
        )}

        <div>
          <ImageUpload
            onUpload={(url) => setForm({ ...form, foto_url: url })}
            defaultImage={form.foto_url}
            tipo="item"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.promocao_ativa}
              onChange={e => setForm({ ...form, promocao_ativa: e.target.checked })}
            />{' '}
            Promoção
          </label>
          {form.promocao_ativa && (
            <NumericFormat
              value={form.preco_promocional}
              onValueChange={(values) => setForm({ ...form, preco_promocional: values.floatValue })}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="border rounded px-2 py-1 text-sm w-32"
              placeholder="R$ 0,00"
            />
          )}
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.delivery_disponivel}
              onChange={e => setForm({ ...form, delivery_disponivel: e.target.checked })}
            />{' '}
            Delivery
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="bg-orange-600 text-white px-3 py-1 rounded text-sm">
            💾 Salvar
          </button>
          <button type="button" onClick={onCancel} className="border px-3 py-1 rounded text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}