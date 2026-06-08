// src/app/admin/components/GerenciarTiposCozinha.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type TipoCozinha = {
  id: number
  nome: string
  slug: string
  icone: string
  ativo: boolean
  ordem: number
}

export function GerenciarTiposCozinha() {
  const [tipos, setTipos] = useState<TipoCozinha[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<TipoCozinha | null>(null)
  const [form, setForm] = useState({ nome: '', icone: '🍽️', ativo: true, ordem: 0 })

  const carregarTipos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tipos_cozinha')
      .select('*')
      .order('ordem', { ascending: true })
    if (error) console.error(error)
    else setTipos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregarTipos()
  }, [carregarTipos])

  const salvar = async () => {
    if (!form.nome.trim()) {
      alert('O nome é obrigatório')
      return
    }

    const slug = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const dados = {
      nome: form.nome.trim(),
      slug,
      icone: form.icone || '🍽️',
      ativo: form.ativo,
      ordem: form.ordem,
    }

    if (editando) {
      // Atualização otimista
      const novosTipos = tipos.map(t => t.id === editando.id ? { ...t, ...dados } : t)
      setTipos(novosTipos)
      const { error } = await supabase.from('tipos_cozinha').update(dados).eq('id', editando.id)
      if (error) {
        console.error(error)
        alert('Erro ao atualizar: ' + error.message)
        carregarTipos() // rollback
      }
    } else {
      // Inserção otimista (id temporário)
      const tempId = Date.now()
      const novoTipo = { ...dados, id: tempId }
      setTipos(prev => [...prev, novoTipo].sort((a, b) => a.ordem - b.ordem))
      const { data, error } = await supabase.from('tipos_cozinha').insert(dados).select().single()
      if (error) {
        console.error(error)
        alert('Erro ao criar: ' + error.message)
        carregarTipos() // rollback
      } else if (data) {
        // Substitui o temporário pelo real
        setTipos(prev => prev.map(t => t.id === tempId ? data : t))
      }
    }
    fecharModal()
  }

  const excluir = async (id: number, nome: string) => {
    // Verificar se há estabelecimentos usando este tipo
    const { count, error } = await supabase
      .from('estabelecimento_tipos_cozinha')
      .select('*', { count: 'exact', head: true })
      .eq('tipo_cozinha_id', id)
    if (error) console.error(error)
    if (count && count > 0) {
      alert(`Não é possível excluir "${nome}" porque ${count} estabelecimento(s) estão vinculados.`)
      return
    }
    if (!confirm(`Excluir tipo "${nome}"?`)) return

    // Atualização otimista
    setTipos(prev => prev.filter(t => t.id !== id))
    const { error: deleteError } = await supabase.from('tipos_cozinha').delete().eq('id', id)
    if (deleteError) {
      alert('Erro ao excluir: ' + deleteError.message)
      carregarTipos()
    }
  }

  const toggleAtivo = async (id: number, ativoAtual: boolean) => {
    setTipos(prev =>
      prev.map(t => t.id === id ? { ...t, ativo: !ativoAtual } : t)
    )
    const { error } = await supabase
      .from('tipos_cozinha')
      .update({ ativo: !ativoAtual })
      .eq('id', id)
    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
      carregarTipos()
    }
  }

  const reordenar = async (id: number, novaOrdem: number) => {
    setTipos(prev =>
      prev.map(t => t.id === id ? { ...t, ordem: novaOrdem } : t)
    )
    const { error } = await supabase
      .from('tipos_cozinha')
      .update({ ordem: novaOrdem })
      .eq('id', id)
    if (error) {
      alert('Erro ao reordenar: ' + error.message)
      carregarTipos()
    }
  }

  const abrirModal = (tipo?: TipoCozinha) => {
    if (tipo) {
      setEditando(tipo)
      setForm({
        nome: tipo.nome,
        icone: tipo.icone || '🍽️',
        ativo: tipo.ativo,
        ordem: tipo.ordem,
      })
    } else {
      setEditando(null)
      setForm({ nome: '', icone: '🍽️', ativo: true, ordem: tipos.length })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setEditando(null)
    setForm({ nome: '', icone: '🍽️', ativo: true, ordem: 0 })
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🍽️ Tipos de Cozinha</h2>
        <button
          onClick={() => abrirModal()}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          ➕ Novo Tipo
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Ordem</th>
              <th className="p-3 text-left">Ícone</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="number"
                    value={tipo.ordem}
                    onChange={(e) => reordenar(tipo.id, parseInt(e.target.value))}
                    className="w-16 border rounded px-1 py-0.5 text-center"
                  />
                </td>
                <td className="p-3 text-2xl">{tipo.icone}</td>
                <td className="p-3 font-medium">{tipo.nome}</td>
                <td className="p-3 text-gray-500 text-sm">{tipo.slug}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleAtivo(tipo.id, tipo.ativo)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tipo.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tipo.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrirModal(tipo)} className="text-blue-600">
                      ✏️
                    </button>
                    <button onClick={() => excluir(tipo.id, tipo.nome)} className="text-red-600">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edição/criação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">{editando ? '✏️ Editar Tipo' : '➕ Novo Tipo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ícone (emoji)</label>
                <input
                  type="text"
                  value={form.icone}
                  onChange={(e) => setForm({ ...form, icone: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-2xl"
                  placeholder="🍽️"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite um emoji (ex: 🍽️, 🫘, 🍔) ou copie e cole.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Ex: Baiana, Italiana"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  />
                  <span>Ativo (aparece nos cadastros e filtros)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordem (menor = primeiro)</label>
                <input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={salvar} className="bg-orange-600 text-white px-4 py-2 rounded-lg">
                  Salvar
                </button>
                <button onClick={fecharModal} className="border px-4 py-2 rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}