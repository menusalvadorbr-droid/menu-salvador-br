'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'

interface CardapioTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

export default function CardapioTab({ estabelecimentoId, readOnly }: CardapioTabProps) {
  const [menuId, setMenuId] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoItem, setEditandoItem] = useState<any>(null)
  const [fotoUrl, setFotoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ========== ALÉRGENOS (ANVISA) ==========
  const [alergenosDisponiveis, setAlergenosDisponiveis] = useState<any[]>([])
  const [alergenosSelecionados, setAlergenosSelecionados] = useState<string[]>([])

  // Carregar lista de alérgenos da ANVISA
  useEffect(() => {
    const carregarAlergenos = async () => {
      console.log('🔍 Carregando alérgenos...')
      const { data, error } = await supabase
        .from('allergens')
        .select('*')
        .order('nome', { ascending: true })
      if (error) {
        console.error('❌ Erro ao carregar alérgenos:', error)
      } else {
        console.log('✅ Alérgenos carregados:', data?.length || 0, 'itens')
        setAlergenosDisponiveis(data || [])
      }
    }
    carregarAlergenos()
  }, [])

  // Carregar alérgenos de um item ao editar
  const carregarAlergenosDoItem = async (itemId: string) => {
    const { data, error } = await supabase
      .from('item_allergens')
      .select('allergen_id')
      .eq('item_id', itemId)
    if (error) {
      console.error('Erro ao carregar alérgenos do item:', error)
    } else {
      setAlergenosSelecionados(data?.map((a: any) => a.allergen_id) || [])
    }
  }

  // Salvar alérgenos de um item
  const salvarAlergenos = async (itemId: string) => {
    // Deleta alérgenos antigos
    await supabase.from('item_allergens').delete().eq('item_id', itemId)
    // Insere novos
    if (alergenosSelecionados.length > 0) {
      const inserts = alergenosSelecionados.map((allergenId) => ({
        item_id: itemId,
        allergen_id: allergenId,
      }))
      const { error } = await supabase.from('item_allergens').insert(inserts)
      if (error) {
        console.error('Erro ao salvar alérgenos:', error)
        throw new Error('Erro ao salvar alérgenos')
      }
    }
  }

  // ========== CARREGAR DADOS ==========
  useEffect(() => {
    carregarDados()
  }, [estabelecimentoId])

  async function carregarDados() {
    setLoading(true)
    setError(null)

    // 1. Buscar menu ativo
    let { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('ativo', true)
      .maybeSingle()

    if (!menu) {
      const { data: novoMenu } = await supabase
        .from('menus')
        .insert({
          estabelecimento_id: estabelecimentoId,
          nome: 'Cardápio Principal',
          ativo: true,
        })
        .select()
        .single()
      menu = novoMenu
    }

    setMenuId(menu?.id || null)

    // 2. Buscar categorias
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .eq('menu_id', menu.id)
      .order('ordem', { ascending: true })
    setCategorias(cats || [])

    // 3. Buscar itens
    if (cats && cats.length > 0) {
      const categoriaIds = cats.map((c) => c.id)
      const { data: items } = await supabase
        .from('itens_cardapio')
        .select('*')
        .in('categoria_id', categoriaIds)
        .order('ordem', { ascending: true })
      setItens(items || [])
    } else {
      setItens([])
    }

    setLoading(false)
  }

  // ========== CRIAR CATEGORIA ==========
  async function criarCategoria() {
    if (!novaCategoria.trim() || !menuId) return
    const { error } = await supabase
      .from('categorias')
      .insert({ nome: novaCategoria, menu_id: menuId, ordem: categorias.length })
    if (error) {
      setError('Erro ao criar categoria: ' + error.message)
    } else {
      setNovaCategoria('')
      carregarDados()
    }
  }

  // ========== REMOVER CATEGORIA ==========
  async function deletarCategoria(id: string) {
    if (!confirm('Remover esta categoria e todos os itens?')) return
    await supabase.from('categorias').delete().eq('id', id)
    carregarDados()
  }

  // ========== SALVAR ITEM ==========
  async function salvarItem(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    const categoriaId = formData.get('categoria_id') as string
    if (!categoriaId) {
      setError('Selecione uma categoria.')
      return
    }

    const dados: any = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao') || null,
      preco: parseFloat(formData.get('preco') as string) || 0,
      categoria_id: categoriaId,
      disponivel: formData.get('disponivel') === 'on',
      codigo: formData.get('codigo') || null,
      delivery_disponivel: formData.get('delivery_disponivel') === 'on',
      foto_url: fotoUrl || null,
      ordem: 0,
    }

    if (!dados.nome || dados.preco <= 0) {
      setError('Nome e preço são obrigatórios.')
      return
    }

    try {
      let itemId
      if (editandoItem) {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .update(dados)
          .eq('id', editandoItem.id)
          .select()
        if (error) throw error
        itemId = editandoItem.id
      } else {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .insert(dados)
          .select()
        if (error) throw error
        itemId = data?.[0]?.id
      }

      // Salvar alérgenos (se houver itemId)
      if (itemId) {
        await salvarAlergenos(itemId)
      }

      setMostrarForm(false)
      setEditandoItem(null)
      setFotoUrl('')
      setAlergenosSelecionados([])
      carregarDados()
    } catch (err: any) {
      setError('Erro ao salvar item: ' + err.message)
    }
  }

  // ========== DELETAR ITEM ==========
  async function deletarItem(id: string) {
    if (!confirm('Remover este item?')) return
    await supabase.from('itens_cardapio').delete().eq('id', id)
    carregarDados()
  }

  // ========== TOGGLE DISPONÍVEL ==========
  async function toggleDisponivel(id: string, atual: boolean) {
    await supabase.from('itens_cardapio').update({ disponivel: !atual }).eq('id', id)
    carregarDados()
  }

  // ========== EDIÇÃO DE ITEM ==========
  function editarItem(item: any) {
    setEditandoItem(item)
    setFotoUrl(item.foto_url || '')
    setMostrarForm(true)
    carregarAlergenosDoItem(item.id)
  }

  // ========== RENDER ==========
  if (loading) return <div className="text-gray-500 text-center py-8">Carregando...</div>

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">🍽️ Cardápio</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            placeholder="Nova categoria"
            className="border rounded-lg px-3 py-1 text-sm"
            disabled={readOnly}
          />
          <button
            onClick={criarCategoria}
            disabled={readOnly || !novaCategoria.trim() || !menuId}
            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          setMostrarForm(!mostrarForm)
          setEditandoItem(null)
          setFotoUrl('')
          setAlergenosSelecionados([])
        }}
        disabled={readOnly}
        className="mb-4 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
      >
        {mostrarForm ? 'Cancelar' : '+ Adicionar item'}
      </button>

      {mostrarForm && (
        <form onSubmit={salvarItem} className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3 border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              name="codigo"
              defaultValue={editandoItem?.codigo || ''}
              placeholder="Código (ex: 21)"
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              name="nome"
              defaultValue={editandoItem?.nome || ''}
              placeholder="Nome do item *"
              required
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              name="preco"
              type="number"
              step="0.01"
              defaultValue={editandoItem?.preco || ''}
              placeholder="Preço *"
              required
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="descricao"
            defaultValue={editandoItem?.descricao || ''}
            placeholder="Descrição"
            className="border rounded-lg px-3 py-2 text-sm w-full"
            rows={2}
          />
          <select
            name="categoria_id"
            defaultValue={editandoItem?.categoria_id || ''}
            className="border rounded-lg px-3 py-2 text-sm w-full"
            required
          >
            <option value="">Selecione a categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <ImageUpload
            onUpload={(url) => setFotoUrl(url)}
            onRemove={() => setFotoUrl('')}
            currentImage={editandoItem?.foto_url || null}
            label="Foto do item"
            aspectRatio="square"
            maxSize={2}
          />

          <div className="flex gap-4 text-sm">
            <label>
              <input type="checkbox" name="disponivel" defaultChecked={editandoItem?.disponivel !== false} /> Disponível
            </label>
            <label>
              <input type="checkbox" name="delivery_disponivel" defaultChecked={editandoItem?.delivery_disponivel || false} /> Delivery
            </label>
          </div>

          {/* ===== ALÉRGENOS (ANVISA) ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">⚠️ Alérgenos (ANVISA)</label>
            {alergenosDisponiveis.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                Nenhum alérgeno cadastrado. Verifique a tabela 'allergens' no Supabase.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {alergenosDisponiveis.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 rounded border border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={alergenosSelecionados.includes(a.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAlergenosSelecionados([...alergenosSelecionados, a.id])
                        } else {
                          setAlergenosSelecionados(alergenosSelecionados.filter((id) => id !== a.id))
                        }
                      }}
                      className="accent-orange-500"
                    />
                    {a.icone && <span>{a.icone}</span>} {a.nome}
                  </label>
                ))}
              </div>
            )}
            {alergenosSelecionados.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {alergenosSelecionados.length} alérgeno(s) selecionado(s)
              </p>
            )}
          </div>

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            {editandoItem ? 'Atualizar' : 'Salvar'} item
          </button>
        </form>
      )}

      <div className="space-y-4">
        {categorias.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhuma categoria cadastrada.</p>
        ) : (
          categorias.map((cat) => {
            const itensDaCategoria = itens.filter((i) => i.categoria_id === cat.id)
            return (
              <div key={cat.id} className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 font-medium border-b flex justify-between items-center">
                  <span>
                    {cat.nome} ({itensDaCategoria.length})
                  </span>
                  {!readOnly && (
                    <button onClick={() => deletarCategoria(cat.id)} className="text-red-500 text-sm hover:underline">
                      Remover
                    </button>
                  )}
                </div>
                {itensDaCategoria.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">Nenhum item nesta categoria.</div>
                ) : (
                  <div className="divide-y">
                    {itensDaCategoria.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between p-3 hover:bg-gray-50 gap-2">
                        <div className="flex items-center gap-3">
                          {item.foto_url && (
                            <img
                              src={item.foto_url}
                              alt={item.nome}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.codigo && (
                                <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded">{item.codigo}</span>
                              )}
                              <span className={!item.disponivel ? 'line-through text-gray-400' : ''}>{item.nome}</span>
                              <span className="text-sm font-bold">R$ {item.preco?.toFixed(2)}</span>
                              {item.delivery_disponivel && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Delivery</span>
                              )}
                            </div>
                            {item.descricao && <p className="text-xs text-gray-500">{item.descricao}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleDisponivel(item.id, item.disponivel)}
                            className={`text-xs px-2 py-1 rounded ${
                              item.disponivel ? 'bg-gray-200 hover:bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            disabled={readOnly}
                          >
                            {item.disponivel ? 'Ocultar' : 'Mostrar'}
                          </button>
                          <button
                            onClick={() => editarItem(item)}
                            className="text-xs text-blue-600 hover:underline"
                            disabled={readOnly}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => deletarItem(item.id)}
                            className="text-xs text-red-500 hover:underline"
                            disabled={readOnly}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}