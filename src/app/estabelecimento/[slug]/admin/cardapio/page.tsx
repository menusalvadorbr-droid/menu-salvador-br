// src/app/estabelecimento/[slug]/admin/cardapio/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function EditorCardapio() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [menu, setMenu] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [itemEditando, setItemEditando] = useState<any>(null)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')

  // Estado do formulário
  const [formItem, setFormItem] = useState({
    nome: '',
    descricao: '',
    preco: '',
    preco_promocional: '',
    promocao_ativa: false,
    promocao_titulo: '',
    desconto_percentual: '',
    disponivel: true,
    codigo: '',
    tags: ''
  })

  // Estado para nova categoria
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [slug])

  const carregarDados = async () => {
    setLoading(true)

    // Buscar estabelecimento
    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('slug', slug)
      .single()

    if (estab) {
      setEstabelecimento(estab)

      // Buscar menu
      const { data: menuData } = await supabase
        .from('menus')
        .select('id')
        .eq('estabelecimento_id', estab.id)
        .eq('ativo', true)
        .single()

      if (menuData) {
        setMenu(menuData)

        // Buscar categorias com itens
        const { data: cats } = await supabase
          .from('categorias')
          .select('*, itens_cardapio(*)')
          .eq('menu_id', menuData.id)
          .order('ordem')

        if (cats) {
          cats.forEach((cat: any) => {
            cat.itens_cardapio.sort((a: any, b: any) => a.ordem - b.ordem)
          })
          setCategorias(cats)
        }
      }
    }

    setLoading(false)
  }

  // Adicionar item
  const adicionarItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoriaSelecionada || !formItem.nome || !formItem.preco) {
      alert('Preencha nome e preço!')
      return
    }

    const tagsArray = formItem.tags
      ? formItem.tags.split(',').map((t: string) => t.trim())
      : []

    const { error } = await supabase
      .from('itens_cardapio')
      .insert({
        categoria_id: categoriaSelecionada,
        nome: formItem.nome,
        descricao: formItem.descricao,
        preco: parseFloat(formItem.preco),
        preco_promocional: formItem.preco_promocional ? parseFloat(formItem.preco_promocional) : null,
        promocao_ativa: formItem.promocao_ativa,
        promocao_titulo: formItem.promocao_titulo || null,
        desconto_percentual: formItem.desconto_percentual ? parseInt(formItem.desconto_percentual) : null,
        disponivel: formItem.disponivel,
        codigo: formItem.codigo || null,
        tags: tagsArray
      })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setMostrarModal(false)
      limparForm()
      carregarDados()
    }
  }

  // Excluir item
  const excluirItem = async (id: string) => {
    if (confirm('Excluir este item?')) {
      await supabase
        .from('itens_cardapio')
        .delete()
        .eq('id', id)

      carregarDados()
    }
  }

  // Criar categoria
  const criarCategoria = async () => {
    if (!novaCategoria || !menu) return

    const { error } = await supabase
      .from('categorias')
      .insert({
        menu_id: menu.id,
        nome: novaCategoria,
        ordem: categorias.length
      })

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      setNovaCategoria('')
      setMostrarNovaCategoria(false)
      carregarDados()
    }
  }

  const limparForm = () => {
    setFormItem({
      nome: '',
      descricao: '',
      preco: '',
      preco_promocional: '',
      promocao_ativa: false,
      promocao_titulo: '',
      desconto_percentual: '',
      disponivel: true,
      codigo: '',
      tags: ''
    })
    setCategoriaSelecionada('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/estabelecimento/${slug}/admin`} className="text-gray-600 hover:text-gray-900">
              ← Voltar
            </Link>
            <h1 className="text-xl font-bold">📋 Gerenciar Cardápio</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarNovaCategoria(true)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              ➕ Nova Categoria
            </button>
            <button
              onClick={() => setMostrarModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700"
            >
              ➕ Novo Item
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Modal Nova Categoria */}
        {mostrarNovaCategoria && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="font-bold text-lg mb-4">Nova Categoria</h3>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                placeholder="Nome da categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={criarCategoria}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Criar
                </button>
                <button
                  onClick={() => setMostrarNovaCategoria(false)}
                  className="border px-4 py-2 rounded-lg text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Item */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <h3 className="font-bold text-lg mb-4">Novo Item</h3>

              <form onSubmit={adicionarItem} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Categoria *</label>
                  <select
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      value={formItem.nome}
                      onChange={(e) => setFormItem({...formItem, nome: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Código</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-3 py-2"
                      value={formItem.codigo}
                      onChange={(e) => setFormItem({...formItem, codigo: e.target.value})}
                      placeholder="#001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">Descrição</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                    value={formItem.descricao}
                    onChange={(e) => setFormItem({...formItem, descricao: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">Preço *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      value={formItem.preco}
                      onChange={(e) => setFormItem({...formItem, preco: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Preço Promocional</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                      value={formItem.preco_promocional}
                      onChange={(e) => setFormItem({...formItem, preco_promocional: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formItem.promocao_ativa}
                      onChange={(e) => setFormItem({...formItem, promocao_ativa: e.target.checked})}
                    />
                    <span className="text-sm">Promoção ativa</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formItem.disponivel}
                      onChange={(e) => setFormItem({...formItem, disponivel: e.target.checked})}
                    />
                    <span className="text-sm">Disponível</span>
                  </label>
                </div>

                {formItem.promocao_ativa && (
                  <div className="grid grid-cols-2 gap-3 bg-red-50 p-3 rounded-lg">
                    <div>
                      <label className="block text-sm mb-1">Título da Promoção</label>
                      <input
                        type="text"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                        value={formItem.promocao_titulo}
                        onChange={(e) => setFormItem({...formItem, promocao_titulo: e.target.value})}
                        placeholder="Ex: Terça do Acarajé"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Desconto %</label>
                      <input
                        type="number"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"
                        value={formItem.desconto_percentual}
                        onChange={(e) => setFormItem({...formItem, desconto_percentual: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition"                    value={formItem.tags}
                    onChange={(e) => setFormItem({...formItem, tags: e.target.value})}
                    placeholder="vegano, picante, sem glúten"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    💾 Salvar Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModal(false)
                      limparForm()
                    }}
                    className="border px-4 py-2 rounded-lg text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de Categorias e Itens */}
        <div className="space-y-4">
          {categorias.map((categoria: any) => (
            <div key={categoria.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  {categoria.eh_promocao && <span>🎉</span>}
                  <h3 className="font-bold">{categoria.nome}</h3>
                  <span className="text-sm text-gray-500">
                    ({categoria.itens_cardapio?.length || 0} itens)
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCategoriaSelecionada(categoria.id)
                    setMostrarModal(true)
                  }}
                  className="text-orange-600 text-sm hover:underline"
                >
                  + Adicionar Item
                </button>
              </div>

              <div className="divide-y">
                {categoria.itens_cardapio?.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.nome}</h4>
                        {item.codigo && (
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">#{item.codigo}</span>
                        )}
                        {item.promocao_ativa && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                            🎉 Promoção
                          </span>
                        )}
                        {!item.disponivel && (
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                            Indisponível
                          </span>
                        )}
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {item.preco_promocional ? (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              R$ {item.preco?.toFixed(2)}
                            </span>
                            <span className="ml-2 font-bold text-green-600">
                              R$ {item.preco_promocional?.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">R$ {item.preco?.toFixed(2)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => excluirItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {(!categoria.itens_cardapio || categoria.itens_cardapio.length === 0) && (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Nenhum item nesta categoria
                  </div>
                )}
              </div>
            </div>
          ))}

          {categorias.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📋</p>
              <p className="mb-2">Nenhuma categoria cadastrada</p>
              <button
                onClick={() => setMostrarNovaCategoria(true)}
                className="text-orange-600 hover:underline"
              >
                Criar primeira categoria →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}