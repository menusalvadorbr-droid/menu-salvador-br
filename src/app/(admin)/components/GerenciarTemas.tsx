'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Tema {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preview_image_url: string | null
  config: any
  tipo: 'free' | 'premium'
  ativo: boolean
  created_at: string
}

export default function GerenciarTemas() {
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Tema | null>(null)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    descricao: '',
    preview_image_url: '',
    config: JSON.stringify(
      { cor_primaria: '#f97316', cor_secundaria: '#ffffff', layout: 'grade', fonte: 'sans-serif' },
      null,
      2
    ),
    tipo: 'free',
    ativo: true,
  })

  useEffect(() => {
    carregarTemas()
  }, [])

  async function carregarTemas() {
    const { data } = await supabase.from('temas').select('*').order('created_at', { ascending: false })
    if (data) setTemas(data)
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function salvarTema(e: React.FormEvent) {
    e.preventDefault()
    const dados = {
      nome: form.nome,
      slug: form.slug,
      descricao: form.descricao || null,
      preview_image_url: form.preview_image_url || null,
      config: JSON.parse(form.config),
      tipo: form.tipo,
      ativo: form.ativo,
    }

    let error
    if (editando) {
      ;({ error } = await supabase.from('temas').update(dados).eq('id', editando.id))
    } else {
      ;({ error } = await supabase.from('temas').insert(dados))
    }

    if (error) {
      alert('Erro ao salvar tema: ' + error.message)
    } else {
      setEditando(null)
      resetForm()
      carregarTemas()
    }
  }

  function resetForm() {
    setForm({
      nome: '',
      slug: '',
      descricao: '',
      preview_image_url: '',
      config: JSON.stringify(
        { cor_primaria: '#f97316', cor_secundaria: '#ffffff', layout: 'grade', fonte: 'sans-serif' },
        null,
        2
      ),
      tipo: 'free',
      ativo: true,
    })
  }

  function editarTema(tema: Tema) {
    setEditando(tema)
    setForm({
      nome: tema.nome,
      slug: tema.slug,
      descricao: tema.descricao || '',
      preview_image_url: tema.preview_image_url || '',
      config: JSON.stringify(tema.config, null, 2),
      tipo: tema.tipo,
      ativo: tema.ativo,
    })
  }

  async function deletarTema(id: string) {
    if (!confirm('Remover este tema?')) return
    const { error } = await supabase.from('temas').delete().eq('id', id)
    if (error) alert('Erro ao remover: ' + error.message)
    else carregarTemas()
  }

  if (loading) return <div className="text-gray-500">Carregando temas...</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🎨 Gerenciar Temas</h2>
      <p className="text-gray-500 text-sm mb-4">Crie e edite temas que os donos de estabelecimentos poderão escolher.</p>

      <form onSubmit={salvarTema} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3 border">
        <h3 className="font-semibold">{editando ? 'Editar tema' : 'Novo tema'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do tema"
            className="border p-2 rounded"
            required
          />
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="Slug (ex: moderno)"
            className="border p-2 rounded"
            required
          />
          <input
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição curta"
            className="border p-2 rounded"
          />
          <input
            name="preview_image_url"
            value={form.preview_image_url}
            onChange={handleChange}
            placeholder="URL da imagem de prévia"
            className="border p-2 rounded"
          />
          <select name="tipo" value={form.tipo} onChange={handleChange} className="border p-2 rounded">
            <option value="free">Grátis</option>
            <option value="premium">Premium</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="ativo" checked={form.ativo} onChange={handleChange} />
            Ativo
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Configuração (JSON)</label>
          <textarea
            name="config"
            value={form.config}
            onChange={handleChange}
            rows={4}
            className="w-full border p-2 rounded font-mono text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Ex: {`{"cor_primaria":"#f97316","cor_secundaria":"#ffffff","layout":"grade","fonte":"sans-serif"}`}</p>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            {editando ? 'Atualizar' : 'Criar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={() => {
                setEditando(null)
                resetForm()
              }}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {temas.map((tema) => (
          <div key={tema.id} className="bg-white p-4 rounded-lg shadow border">
            {tema.preview_image_url && (
              <img src={tema.preview_image_url} alt={tema.nome} className="w-full h-32 object-cover rounded mb-2" />
            )}
            <h3 className="font-bold">{tema.nome}</h3>
            <p className="text-sm text-gray-500">{tema.descricao}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  tema.tipo === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100'
                }`}
              >
                {tema.tipo === 'premium' ? '🔒 Premium' : 'Grátis'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  tema.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {tema.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => editarTema(tema)} className="text-blue-600 text-sm hover:underline">
                Editar
              </button>
              <button onClick={() => deletarTema(tema.id)} className="text-red-600 text-sm hover:underline">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}