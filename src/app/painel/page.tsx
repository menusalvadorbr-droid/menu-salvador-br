'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { ImageUpload } from '@/components/upload/ImageUpload'

// ----------------------------------------------------------------
// Constantes
// ----------------------------------------------------------------
const TEMAS_PADRAO = ['raiz-brasileira']

// ----------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------

function DashboardCards({
  estabelecimento,
  categorias,
  limitePlano,
}: {
  estabelecimento: any
  categorias: any[]
  limitePlano: number
}) {
  const publicados = categorias.reduce(
    (total, cat) => total + (cat.itens_cardapio || []).filter((i: any) => i.disponivel).length,
    0
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Scans QR Code</p>
        <p className="text-3xl font-bold text-blue-600">{estabelecimento?.scans_qrcode || 0}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Itens Publicados</p>
        <p className="text-3xl font-bold text-orange-600">
          {publicados} <span className="text-lg text-gray-400">/ {limitePlano}</span>
        </p>
        {publicados >= limitePlano && (
          <p className="text-xs text-red-500 mt-1">Limite atingido. Faça upgrade para publicar mais.</p>
        )}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-500 text-sm">Categorias</p>
        <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
      </div>
    </div>
  )
}

function ListaCategorias({
  categorias,
  onAdicionarItem,
  onEditarItem,
  onPublicarItem,
  onExcluirItem,
  limitePlano,
}: {
  categorias: any[]
  onAdicionarItem: (categoriaId: string) => void
  onEditarItem: (item: any) => void
  onPublicarItem: (itemId: string, disponivel: boolean) => void
  onExcluirItem: (itemId: string) => void
  limitePlano: number
}) {
  const publicados = categorias.reduce(
    (total, cat) => total + (cat.itens_cardapio || []).filter((i: any) => i.disponivel).length,
    0
  )

  return (
    <div className="space-y-4">
      {categorias.map((categoria: any) => (
        <div key={categoria.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">
              {categoria.nome}
              <span className="text-sm text-gray-500 ml-2 font-normal">
                ({categoria.itens_cardapio?.length || 0} itens)
              </span>
            </h3>
            <button
              onClick={() => onAdicionarItem(categoria.id)}
              className="text-orange-600 text-sm font-medium hover:underline"
            >
              + Adicionar Item
            </button>
          </div>

          <div className="divide-y">
            {categoria.itens_cardapio?.length > 0 ? (
              categoria.itens_cardapio.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{item.nome}</span>
                      {item.codigo && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">#{item.codigo}</span>
                      )}
                    </div>
                    {item.descricao && <p className="text-sm text-gray-500 mt-1">{item.descricao}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">
                      R$ {item.preco?.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onEditarItem(item)}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Editar item"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onPublicarItem(item.id, item.disponivel)}
                      disabled={!item.disponivel && publicados >= limitePlano}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.disponivel
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                      title={!item.disponivel && publicados >= limitePlano ? 'Limite de itens atingido' : item.disponivel ? 'Despublicar' : 'Publicar'}
                    >
                      {item.disponivel ? '✓ Publicado' : '✕ Rascunho'}
                    </button>
                    <button onClick={() => onExcluirItem(item.id)} className="text-red-500 hover:text-red-700 transition" title="Excluir item">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">Nenhum item nesta categoria</div>
            )}
          </div>
        </div>
      ))}

      {categorias.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p className="mb-2">Nenhuma categoria cadastrada</p>
        </div>
      )}
    </div>
  )
}

function SecaoAparencia({
  temasDisponiveis,
  temasPermitidos,
  temaSelecionado,
  onAlterarTema,
}: {
  temasDisponiveis: any[]
  temasPermitidos: string[]
  temaSelecionado: string
  onAlterarTema: (slug: string) => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🎨 Aparência do Cardápio</h2>
      <p className="text-gray-600 mb-6">Escolha um tema para o seu menu digital. A disponibilidade depende do seu plano.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {temasDisponiveis.map((tema) => {
          const permitido = temasPermitidos.includes(tema.slug)
          const ativo = temaSelecionado === tema.slug
          return (
            <button
              key={tema.slug}
              disabled={!permitido}
              onClick={() => onAlterarTema(tema.slug)}
              className={`p-4 rounded-xl border-2 text-left transition ${
                ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
              } ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex gap-1 mb-3">
                {(tema.cores || ['#ccc']).slice(0, 3).map((cor: string) => (
                  <div key={cor} className="w-5 h-5 rounded-full" style={{ backgroundColor: cor }} />
                ))}
              </div>
              <p className="font-semibold text-gray-800">{tema.nome}</p>
              <p className="text-xs text-gray-500">{tema.descricao}</p>
              {!permitido && <span className="text-xs text-red-500 mt-1 block">🔒 Plano superior</span>}
              {ativo && <span className="text-xs text-orange-600 mt-1 block">✓ Em uso</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------

export default function PainelDono() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')

  // Estados do cardápio
  const [mostrarModal, setMostrarModal] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [itemEditandoId, setItemEditandoId] = useState<string | null>(null)

  const [formItem, setFormItem] = useState({
    nome: '',
    descricao: '',
    preco: '',
    preco_promocional: '',
    promocao_ativa: false,
    promocao_titulo: '',
    desconto_percentual: '',
    disponivel: false,
    codigo: '',
    tags: '',
    foto_url: '',
  })
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  // Temas
  const [temasPermitidos, setTemasPermitidos] = useState<string[]>(TEMAS_PADRAO)
  const [temaSelecionado, setTemaSelecionado] = useState('raiz-brasileira')
  const [temasDisponiveis, setTemasDisponiveis] = useState<any[]>([])
  const [limitePlano, setLimitePlano] = useState(15)

  // QR Code
  const [modelosQRPermitidos, setModelosQRPermitidos] = useState<string[]>([])
  const [modelosQRDisponiveis, setModelosQRDisponiveis] = useState<any[]>([])
  const [modeloQRSelecionado, setModeloQRSelecionado] = useState('classico')

  useEffect(() => {
    const userData = localStorage.getItem('usuario')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    setUsuario(user)
    if (user.estabelecimentos) {
      setEstabelecimento(user.estabelecimentos)
      carregarCardapio(user.estabelecimentos.id)
      carregarTemasEPlano(user.estabelecimentos.id, user.estabelecimentos.plano_id)
      carregarModelosQR(user.estabelecimentos.id, user.estabelecimentos.plano_id)
    } else if (user.estabelecimento_id) {
      carregarEstabelecimento(user.estabelecimento_id)
    }
    setLoading(false)
  }, [])

  const carregarEstabelecimento = async (id: string) => {
    const { data } = await supabase.from('estabelecimentos').select('*').eq('id', id).single()
    if (data) {
      setEstabelecimento(data)
      carregarCardapio(data.id)
      carregarTemasEPlano(data.id, data.plano_id)
      carregarModelosQR(data.id, data.plano_id)
    }
  }

  const carregarCardapio = useCallback(async (estabId: string) => {
    const { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabId)
      .eq('ativo', true)
      .single()
    if (menu) {
      const { data: cats } = await supabase
        .from('categorias')
        .select('*, itens_cardapio(*)')
        .eq('menu_id', menu.id)
        .order('ordem')
      if (cats) setCategorias(cats)
    }
  }, [])

  const carregarTemasEPlano = async (estabId: string, planoId?: string) => {
    let idPlano = planoId
    if (!idPlano) {
      const { data: estab } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = estab?.plano_id
    }
    if (idPlano) {
      const { data: plano } = await supabase.from('planos').select('temas_permitidos, limite_itens').eq('id', idPlano).single()
      if (plano) {
        setTemasPermitidos(plano.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(plano.limite_itens || 15)
      }
    } else {
      const { data: planoGratis } = await supabase.from('planos').select('temas_permitidos, limite_itens').eq('slug', 'gratis').single()
      if (planoGratis) {
        setTemasPermitidos(planoGratis.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(planoGratis.limite_itens || 15)
      }
    }
    const { data: todosTemas } = await supabase.from('temas').select('*')
    if (todosTemas) setTemasDisponiveis(todosTemas)
    const { data: menu } = await supabase.from('menus').select('tema').eq('estabelecimento_id', estabId).single()
    if (menu?.tema) setTemaSelecionado(menu.tema)
  }

  const carregarModelosQR = async (estabId: string, planoId?: string) => {
    let idPlano = planoId
    if (!idPlano) {
      const { data: estab } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = estab?.plano_id
    }
    if (idPlano) {
      const { data: plano } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('id', idPlano).single()
      if (plano) setModelosQRPermitidos(plano.modelos_qrcode_permitidos || [])
    } else {
      const { data: planoGratis } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('slug', 'gratis').single()
      if (planoGratis) setModelosQRPermitidos(planoGratis.modelos_qrcode_permitidos || [])
    }
    const { data: todosModelos } = await supabase.from('modelos_qrcode').select('*')
    if (todosModelos) setModelosQRDisponiveis(todosModelos)
    if (estabId) {
      const { data: estab } = await supabase.from('estabelecimentos').select('qrcode_modelo').eq('id', estabId).single()
      if (estab?.qrcode_modelo) setModeloQRSelecionado(estab.qrcode_modelo)
    }
  }

  const publicarItem = async (itemId: string, disponivel: boolean) => {
    if (!disponivel) {
      const publicados = categorias.reduce(
        (total, cat) => total + (cat.itens_cardapio || []).filter((i: any) => i.disponivel).length,
        0
      )
      if (publicados >= limitePlano) {
        alert(`Você atingiu o limite de ${limitePlano} itens publicados. Faça upgrade para publicar mais.`)
        return
      }
    }
    const novoStatus = !disponivel
    await supabase.from('itens_cardapio').update({ disponivel: novoStatus }).eq('id', itemId)
    carregarCardapio(estabelecimento.id)
  }

  const excluirItem = async (id: string) => {
    if (confirm('Excluir este item?')) {
      await supabase.from('itens_cardapio').delete().eq('id', id)
      carregarCardapio(estabelecimento.id)
    }
  }

  const abrirEdicao = (item: any) => {
    setFormItem({
      nome: item.nome,
      descricao: item.descricao || '',
      preco: item.preco?.toString() || '',
      preco_promocional: item.preco_promocional?.toString() || '',
      promocao_ativa: item.promocao_ativa,
      promocao_titulo: item.promocao_titulo || '',
      desconto_percentual: item.desconto_percentual?.toString() || '',
      disponivel: item.disponivel,
      codigo: item.codigo || '',
      tags: item.tags?.join(', ') || '',
      foto_url: item.foto_url || '',
    })
    setCategoriaSelecionada(item.categoria_id)
    setItemEditandoId(item.id)
    setModoEdicao(true)
    setMostrarModal(true)
  }

  const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaSelecionada || !formItem.nome || !formItem.preco) {
      alert('Preencha nome e preço!')
      return
    }
    const tagsArray = formItem.tags ? formItem.tags.split(',').map((t: string) => t.trim()) : []
    const dados = {
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
      tags: tagsArray,
      foto_url: formItem.foto_url || null,
    }

    let error
    if (modoEdicao && itemEditandoId) {
      const { error: err } = await supabase.from('itens_cardapio').update(dados).eq('id', itemEditandoId)
      error = err
    } else {
      const { error: err } = await supabase.from('itens_cardapio').insert(dados)
      error = err
    }

    if (error) {
      alert('Erro ao salvar item: ' + error.message)
    } else {
      setMostrarModal(false)
      limparForm()
      carregarCardapio(estabelecimento.id)
    }
  }

  const criarCategoria = async () => {
    if (!novaCategoria || !estabelecimento) {
      alert('Digite um nome para a categoria')
      return
    }
    let { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabelecimento.id)
      .eq('ativo', true)
      .single()
    if (!menu) {
      const { data: novoMenu, error: erroMenu } = await supabase
        .from('menus')
        .insert({
          estabelecimento_id: estabelecimento.id,
          nome: 'Cardápio Principal',
          tema: 'raiz-brasileira',
          ativo: true,
        })
        .select('id')
        .single()
      if (erroMenu) {
        alert('Erro ao criar menu: ' + erroMenu.message)
        return
      }
      menu = novoMenu
    }
    const { error } = await supabase.from('categorias').insert({
      menu_id: menu.id,
      nome: novaCategoria,
      ordem: categorias.length,
    })
    if (error) {
      alert('Erro ao criar categoria: ' + error.message)
    } else {
      setNovaCategoria('')
      setMostrarNovaCategoria(false)
      carregarCardapio(estabelecimento.id)
    }
  }

  const alterarTema = async (temaSlug: string) => {
    if (!estabelecimento) return
    const { error } = await supabase.from('menus').update({ tema: temaSlug }).eq('estabelecimento_id', estabelecimento.id)
    if (!error) setTemaSelecionado(temaSlug)
  }

  const alterarModeloQR = async (modeloSlug: string) => {
    if (!estabelecimento) return
    const { error } = await supabase.from('estabelecimentos').update({ qrcode_modelo: modeloSlug }).eq('id', estabelecimento.id)
    if (!error) setModeloQRSelecionado(modeloSlug)
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
      disponivel: false,
      codigo: '',
      tags: '',
      foto_url: '',
    })
    setCategoriaSelecionada('')
    setModoEdicao(false)
    setItemEditandoId(null)
  }

  const sair = () => {
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
  if (!usuario) return null

  // QRCode Gerado internamente para acessar modelosQRDisponiveis
  const QRCodeGerado = ({ url, modelo }: { url: string; modelo: string }) => {
    const estilo = modelosQRDisponiveis.find((m) => m.slug === modelo)
    const frente = estilo?.cor_frente || '#000000'
    const fundo = estilo?.cor_fundo || '#FFFFFF'

    return (
      <div style={{ background: fundo, padding: '1rem', borderRadius: '1rem' }}>
        <QRCode value={url} size={200} bgColor={fundo} fgColor={frente} level="H" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{estabelecimento?.nome || 'Meu Estabelecimento'}</h1>
            <p className="text-sm text-gray-600">Olá, {usuario.nome}!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {estabelecimento?.qrcode_short_url && (
            <Link href={`/menu/${estabelecimento.qrcode_short_url}`} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              👁️ Ver Cardápio
            </Link>
          )}
          <button onClick={sair} className="text-red-600 text-sm font-medium hover:underline">Sair</button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-60 bg-white min-h-screen shadow-sm p-4 space-y-1">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'cardapio', icon: '📋', label: 'Meu Cardápio' },
            { key: 'qrcode', icon: '📱', label: 'QR Code' },
            { key: 'aparencia', icon: '🎨', label: 'Aparência' },
            { key: 'config', icon: '⚙️', label: 'Configurações' },
          ].map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${
                abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6">
          {abaAtiva === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>
              <DashboardCards estabelecimento={estabelecimento} categorias={categorias} limitePlano={limitePlano} />
            </div>
          )}

          {abaAtiva === 'cardapio' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📋 Meu Cardápio</h2>
                <div className="flex gap-2">
                  <button onClick={() => setMostrarNovaCategoria(true)} className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">
                    ➕ Nova Categoria
                  </button>
                  <button onClick={() => { setModoEdicao(false); setItemEditandoId(null); setMostrarModal(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700">
                    ➕ Novo Item
                  </button>
                </div>
              </div>
              <ListaCategorias
                categorias={categorias}
                onAdicionarItem={(catId) => { setCategoriaSelecionada(catId); setModoEdicao(false); setItemEditandoId(null); setMostrarModal(true); }}
                onEditarItem={abrirEdicao}
                onPublicarItem={publicarItem}
                onExcluirItem={excluirItem}
                limitePlano={limitePlano}
              />
            </div>
          )}

          {abaAtiva === 'qrcode' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📱 Meu QR Code</h2>
              {estabelecimento?.qrcode_short_url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-4">Escolher Estilo</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {modelosQRDisponiveis.map((modelo) => {
                        const permitido = modelosQRPermitidos.includes(modelo.slug)
                        const ativo = modeloQRSelecionado === modelo.slug
                        return (
                          <button
                            key={modelo.slug}
                            disabled={!permitido}
                            onClick={() => alterarModeloQR(modelo.slug)}
                            className={`p-4 rounded-xl border-2 text-left transition ${
                              ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                            } ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex gap-1 mb-2">
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_frente }} />
                              <div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_fundo, border: '1px solid #ddd' }} />
                            </div>
                            <p className="font-semibold text-gray-800">{modelo.nome}</p>
                            <p className="text-xs text-gray-500">{modelo.descricao}</p>
                            {!permitido && <span className="text-xs text-red-500">🔒 Plano superior</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                    <QRCodeGerado
                      url={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/menu/${estabelecimento.qrcode_short_url}`}
                      modelo={modeloQRSelecionado}
                    />
                    <p className="mt-4 text-sm text-gray-600">
                      menu.salvador.br/menu/{estabelecimento.qrcode_short_url}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`menu.salvador.br/menu/${estabelecimento.qrcode_short_url}`)
                        alert('Link copiado!')
                      }}
                      className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg"
                    >
                      📋 Copiar Link
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">QR Code ainda não disponível.</p>
              )}
            </div>
          )}

          {abaAtiva === 'aparencia' && (
            <SecaoAparencia
              temasDisponiveis={temasDisponiveis}
              temasPermitidos={temasPermitidos}
              temaSelecionado={temaSelecionado}
              onAlterarTema={alterarTema}
            />
          )}

          {abaAtiva === 'config' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">⚙️ Configurações</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm max-w-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                    <input type="text" disabled value={estabelecimento?.nome || ''} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bairro</label>
                    <input type="text" disabled value={estabelecimento?.bairro || ''} className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-900" />
                  </div>
                  <p className="text-sm text-gray-500">Em breve você poderá editar estas informações.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Novo/Editar Item */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 mb-4">
              {modoEdicao ? '✏️ Editar Item' : '➕ Novo Item'}
            </h3>
            <form onSubmit={salvarItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria *</label>
                <select required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                  <input type="text" required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={formItem.nome} onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preço *</label>
                  <input type="number" step="0.01" required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={formItem.preco} onChange={(e) => setFormItem({ ...formItem, preco: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" rows={2} value={formItem.descricao} onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Foto do prato</label>
                <ImageUpload
                  onUpload={(url) => setFormItem({ ...formItem, foto_url: url })}
                  defaultImage={formItem.foto_url}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formItem.disponivel} onChange={(e) => setFormItem({ ...formItem, disponivel: e.target.checked })} />
                  <span className="text-sm font-medium text-gray-700">Publicar agora</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">
                  {modoEdicao ? '💾 Atualizar' : '💾 Salvar'}
                </button>
                <button type="button" onClick={() => { setMostrarModal(false); limparForm() }} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {mostrarNovaCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 mb-4">➕ Nova Categoria</h3>
            <input
              type="text"
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-4"
              placeholder="Nome da categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && criarCategoria()}
            />
            <div className="flex gap-3">
              <button onClick={criarCategoria} className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">✅ Criar</button>
              <button onClick={() => { setMostrarNovaCategoria(false); setNovaCategoria('') }} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}