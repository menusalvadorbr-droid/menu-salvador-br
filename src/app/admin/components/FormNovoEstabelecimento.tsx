// src/app/admin/components/FormNovoEstabelecimento.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function FormNovoEstabelecimento({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    nome: '',
    tipo_cozinha: 'baiana',
    tipo_estabelecimento: 'restaurante',
    bairro: '',
    endereco: '',
    whatsapp: '',
    descricao: '',
    plano_id: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [planosLocais, setPlanosLocais] = useState<any[]>([])

  useEffect(() => {
    supabase.from('planos').select('*').then(({ data }) => {
      if (data) setPlanosLocais(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.bairro || !form.endereco) {
      alert('Preencha nome, bairro e endereço!')
      return
    }
    setSalvando(true)

    const slug = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6)

    const shortUrl = Math.random().toString(36).substring(2, 10)

    const { error } = await supabase.from('estabelecimentos').insert({
      nome: form.nome,
      slug,
      tipo_cozinha: form.tipo_cozinha,
      tipo_estabelecimento: form.tipo_estabelecimento,
      bairro: form.bairro,
      endereco: form.endereco,
      whatsapp: form.whatsapp,
      descricao: form.descricao,
      plano_id: form.plano_id || null,
      qrcode_short_url: shortUrl,
      ativo: true,
    })

    if (error) {
      alert('Erro ao cadastrar: ' + error.message)
    } else {
      onSave()
      setForm({
        nome: '',
        tipo_cozinha: 'baiana',
        tipo_estabelecimento: 'restaurante',
        bairro: '',
        endereco: '',
        whatsapp: '',
        descricao: '',
        plano_id: '',
      })
    }
    setSalvando(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">➕ Novo Estabelecimento</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bairro *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cozinha</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_cozinha} onChange={e => setForm({...form, tipo_cozinha: e.target.value})}>
              <option value="baiana">Baiana</option>
              <option value="acaraje">Acarajé</option>
              <option value="brasileira">Brasileira</option>
              <option value="italiana">Italiana</option>
              <option value="japonesa">Japonesa</option>
              <option value="hamburguer">Hambúrguer</option>
              <option value="contemporanea">Contemporânea</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Estabelecimento</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_estabelecimento} onChange={e => setForm({...form, tipo_estabelecimento: e.target.value})}>
              <option value="restaurante">Restaurante</option>
              <option value="bar">Bar</option>
              <option value="cafeteria">Cafeteria</option>
              <option value="banca_acaraje">Banca de Acarajé</option>
              <option value="foodtruck">Food Truck</option>
              <option value="lanchonete">Lanchonete</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Endereço *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plano</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.plano_id} onChange={e => setForm({...form, plano_id: e.target.value})}>
              <option value="">Grátis (padrão)</option>
              {planosLocais.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome} {plano.preco_mensal > 0 ? `- R$ ${plano.preco_mensal}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50">
          {salvando ? 'Salvando...' : '💾 Salvar Estabelecimento'}
        </button>
      </form>
    </div>
  )
}