// src/app/admin/components/EditarEstabelecimentoModal.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface EditarEstabelecimentoModalProps {
  estabelecimento: any
  planos: any[]
  onClose: () => void
  onSave: () => void
}

export function EditarEstabelecimentoModal({ estabelecimento, planos, onClose, onSave }: EditarEstabelecimentoModalProps) {
  const [form, setForm] = useState({
    nome: estabelecimento.nome || '',
    tipo_cozinha: estabelecimento.tipo_cozinha || 'baiana',
    tipo_estabelecimento: estabelecimento.tipo_estabelecimento || 'restaurante',
    bairro: estabelecimento.bairro || '',
    endereco: estabelecimento.endereco || '',
    cep: estabelecimento.cep || '',
    telefone: estabelecimento.telefone || '',
    whatsapp: estabelecimento.whatsapp || '',
    email: estabelecimento.email || '',
    instagram: estabelecimento.instagram || '',
    descricao: estabelecimento.descricao || '',
    plano_id: estabelecimento.plano_id || '',
    ativo: estabelecimento.ativo ?? true,
    destaque: estabelecimento.destaque ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase
      .from('estabelecimentos')
      .update(form)
      .eq('id', estabelecimento.id)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      onSave()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        <h3 className="font-bold text-lg mb-4">✏️ Editar Estabelecimento</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nome *</label><input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Bairro *</label><input type="text" required value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo de Cozinha</label><select value={form.tipo_cozinha} onChange={(e) => setForm({ ...form, tipo_cozinha: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="baiana">Baiana</option><option value="acaraje">Acarajé</option><option value="brasileira">Brasileira</option><option value="italiana">Italiana</option><option value="japonesa">Japonesa</option><option value="hamburguer">Hambúrguer</option><option value="contemporanea">Contemporânea</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Tipo de Estabelecimento</label><select value={form.tipo_estabelecimento} onChange={(e) => setForm({ ...form, tipo_estabelecimento: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="restaurante">Restaurante</option><option value="bar">Bar</option><option value="cafeteria">Cafeteria</option><option value="banca_acaraje">Banca de Acarajé</option><option value="foodtruck">Food Truck</option><option value="lanchonete">Lanchonete</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Plano</label><select value={form.plano_id} onChange={(e) => setForm({ ...form, plano_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Sem plano</option>{planos.map((plano) => (<option key={plano.id} value={plano.id}>{plano.nome} {plano.preco_mensal > 0 ? `- R$ ${plano.preco_mensal}` : ''}</option>))}</select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Endereço</label><input type="text" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">CEP</label><input type="text" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Telefone</label><input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">WhatsApp</label><input type="text" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Instagram</label><input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value.replace('@', '') })} className="w-full border rounded-lg px-3 py-2" placeholder="@usuario" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Descrição</label><textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /><span className="text-sm">Ativo</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.destaque} onChange={(e) => setForm({ ...form, destaque: e.target.checked })} /><span className="text-sm">Destaque ⭐</span></label>
          </div>
          <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">💾 Salvar</button><button type="button" onClick={onClose} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">Cancelar</button></div>
        </form>
      </div>
    </div>
  )
}