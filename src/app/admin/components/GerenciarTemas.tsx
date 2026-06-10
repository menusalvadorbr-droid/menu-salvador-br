// src/app/admin/components/GerenciarTemas.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/upload/ImageUpload'

interface Tema {
  id: string
  slug: string
  nome: string
  background_image: string | null
  background_color: string
  primary_color: string
  secondary_color: string
  text_color: string
  font_family: string
  title_color: string
  description_color: string
  price_color: string
  promo_price_color: string
  tag_bg_color: string
  tag_text_color: string
  button_bg_color: string
  button_text_color: string
  ativo: boolean
  ordem: number
}

const FONTES_DISPONIVEIS = [
  { value: 'system-ui, sans-serif', label: 'Sistema (padrão)' },
  { value: "'Playfair Display', serif", label: 'Playfair Display (serifada)' },
  { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
  { value: "'DM Serif Display', serif", label: 'DM Serif Display' },
  { value: "'Lora', serif", label: 'Lora' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans' },
]

export function GerenciarTemas() {
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Tema | null>(null)
  const [form, setForm] = useState<Partial<Tema>>({
    nome: '',
    background_image: '',
    background_color: '#fef9e8',
    primary_color: '#c7a252',
    secondary_color: '#8b5a2b',
    text_color: '#2c2c2c',
    font_family: 'system-ui, sans-serif',
    title_color: '#2c2c2c',
    description_color: '#5a5a5a',
    price_color: '#2c2c2c',
    promo_price_color: '#c7a252',
    tag_bg_color: '#e8e8e8',
    tag_text_color: '#2c2c2c',
    button_bg_color: '#c7a252',
    button_text_color: '#ffffff',
    ativo: true,
    ordem: 0,
  })

  const carregarTemas = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .order('ordem', { ascending: true })
    if (error) console.error(error)
    else setTemas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    carregarTemas()
  }, [carregarTemas])

  const gerarSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const salvar = async () => {
    if (!form.nome?.trim()) {
      alert('O nome é obrigatório')
      return
    }
    const slug = gerarSlug(form.nome)
    const dados = { ...form, slug }

    if (editando) {
      // Atualização otimista
      const novosTemas = temas.map(t => t.id === editando.id ? { ...t, ...dados } : t)
      setTemas(novosTemas)
      const { error } = await supabase.from('temas').update(dados).eq('id', editando.id)
      if (error) {
        alert('Erro ao atualizar: ' + error.message)
        carregarTemas()
      }
    } else {
      // Inserção otimista (id temporário)
      const tempId = Date.now().toString()
      const novoTema = { ...dados, id: tempId } as Tema
      setTemas(prev => [...prev, novoTema].sort((a, b) => a.ordem - b.ordem))
      const { data, error } = await supabase.from('temas').insert(dados).select().single()
      if (error) {
        alert('Erro ao criar: ' + error.message)
        carregarTemas()
      } else if (data) {
        setTemas(prev => prev.map(t => t.id === tempId ? data : t))
      }
    }
    fecharModal()
  }

  const excluir = async (id: string, nome: string, slug: string) => {
    // Verificar se algum menu está usando este tema
    const { data: menus, error } = await supabase
      .from('menus')
      .select('id', { count: 'exact', head: true })
      .eq('tema', slug)
    if (error) console.error(error)
    if (menus && menus.length > 0) {
      alert(`Não é possível excluir o tema "${nome}" porque existem cardápios usando-o.`)
      return
    }
    if (!confirm(`Excluir tema "${nome}"?`)) return
    setTemas(prev => prev.filter(t => t.id !== id))
    const { error: deleteError } = await supabase.from('temas').delete().eq('id', id)
    if (deleteError) {
      alert('Erro ao excluir: ' + deleteError.message)
      carregarTemas()
    }
  }

  const toggleAtivo = async (id: string, ativoAtual: boolean) => {
    setTemas(prev => prev.map(t => t.id === id ? { ...t, ativo: !ativoAtual } : t))
    const { error } = await supabase.from('temas').update({ ativo: !ativoAtual }).eq('id', id)
    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
      carregarTemas()
    }
  }

  const reordenar = async (id: string, novaOrdem: number) => {
    setTemas(prev => prev.map(t => t.id === id ? { ...t, ordem: novaOrdem } : t))
    const { error } = await supabase.from('temas').update({ ordem: novaOrdem }).eq('id', id)
    if (error) {
      alert('Erro ao reordenar: ' + error.message)
      carregarTemas()
    }
  }

  const abrirModal = (tema?: Tema) => {
    if (tema) {
      setEditando(tema)
      setForm({ ...tema })
    } else {
      setEditando(null)
      setForm({
        nome: '',
        background_image: '',
        background_color: '#fef9e8',
        primary_color: '#c7a252',
        secondary_color: '#8b5a2b',
        text_color: '#2c2c2c',
        font_family: 'system-ui, sans-serif',
        title_color: '#2c2c2c',
        description_color: '#5a5a5a',
        price_color: '#2c2c2c',
        promo_price_color: '#c7a252',
        tag_bg_color: '#e8e8e8',
        tag_text_color: '#2c2c2c',
        button_bg_color: '#c7a252',
        button_text_color: '#ffffff',
        ativo: true,
        ordem: temas.length,
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setEditando(null)
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🎨 Temas do Cardápio</h2>
        <button
          onClick={() => abrirModal()}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          ➕ Novo Tema
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Ordem</th>
              <th className="p-3 text-left">Imagem</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {temas.map((tema) => (
              <tr key={tema.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <input
                    type="number"
                    value={tema.ordem}
                    onChange={(e) => reordenar(tema.id, parseInt(e.target.value))}
                    className="w-16 border rounded px-1 py-0.5 text-center"
                  />
                </td>
                <td className="p-3">
                  {tema.background_image ? (
                    <img src={tema.background_image} alt={tema.nome} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-200" style={{ backgroundColor: tema.background_color }} />
                  )}
                </td>
                <td className="p-3 font-medium">{tema.nome}</td>
                <td className="p-3 text-gray-500 text-sm">{tema.slug}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleAtivo(tema.id, tema.ativo)}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tema.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tema.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrirModal(tema)} className="text-blue-600">✏️</button>
                    <button onClick={() => excluir(tema.id, tema.nome, tema.slug)} className="text-red-600">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de criação/edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editando ? '✏️ Editar Tema' : '➕ Novo Tema'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Imagem de fundo (textura)</label>
                <ImageUpload
                  onUpload={(url) => setForm({ ...form, background_image: url })}
                  defaultImage={form.background_image}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cor de fundo (fallback)</label>
                  <input
                    type="color"
                    value={form.background_color}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor primária (destaques)</label>
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor secundária (botões)</label>
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cor do texto principal</label>
                  <input
                    type="color"
                    value={form.text_color}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                    className="w-full h-10 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fonte</label>
                  <select
                    value={form.font_family}
                    onChange={(e) => setForm({ ...form, font_family: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {FONTES_DISPONIVEIS.map(fonte => (
                      <option key={fonte.value} value={fonte.value}>{fonte.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Cores específicas por elemento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs">Título do prato</label><input type="color" value={form.title_color} onChange={e => setForm({...form, title_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Descrição do prato</label><input type="color" value={form.description_color} onChange={e => setForm({...form, description_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Preço normal</label><input type="color" value={form.price_color} onChange={e => setForm({...form, price_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Preço promocional</label><input type="color" value={form.promo_price_color} onChange={e => setForm({...form, promo_price_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Fundo da tag</label><input type="color" value={form.tag_bg_color} onChange={e => setForm({...form, tag_bg_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Texto da tag</label><input type="color" value={form.tag_text_color} onChange={e => setForm({...form, tag_text_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Fundo do botão</label><input type="color" value={form.button_bg_color} onChange={e => setForm({...form, button_bg_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                  <div><label className="text-xs">Texto do botão</label><input type="color" value={form.button_text_color} onChange={e => setForm({...form, button_text_color: e.target.value})} className="w-full h-8 border rounded" /></div>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} />
                  <span>Ativo (disponível para os donos)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordem (menor = primeiro)</label>
                <input type="number" value={form.ordem} onChange={e => setForm({...form, ordem: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={salvar} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Salvar</button>
                <button onClick={fecharModal} className="border px-4 py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}