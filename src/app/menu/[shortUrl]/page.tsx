// src/app/menu/[shortUrl]/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Lightbox from '@/components/ui/Lightbox'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import { useSacola } from '@/features/delivery/useSacola'
import SacolaDrawer from '@/features/delivery/SacolaDrawer'
import FinalizarPedidoModal from '@/features/delivery/FinalizarPedidoModal'

// ----------------------------------------------------------------
// Componente auxiliar para exibir um item (com os 3 layouts)
// ----------------------------------------------------------------
function ItemCard({
  item,
  layout,
  onAbrirLightbox,
  modoDelivery,
  onAdicionarSacola,
}: {
  item: any
  layout: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  onAbrirLightbox: (src: string) => void
  modoDelivery: boolean
  onAdicionarSacola?: (item: any) => void
}) {
  const promocao = item.promocao_ativa && item.preco_promocional
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
  
  // Código com fonte maior
  const codigoElem = item.codigo ? (
    <span className="font-bold text-lg text-gray-800">{item.codigo}</span>
  ) : null

  // Nome completo com hífen
  const nomeCompleto = item.codigo ? ` - ${item.nome}` : item.nome

  if (layout === 'sem-foto') {
    return (
      <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {codigoElem}
              <span className="font-semibold text-gray-900">{nomeCompleto}</span>
              {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">Promoção</span>}
            </div>
            {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {promocao ? (
              <>
                <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                <div className="text-lg font-bold text-green-600">R$ {fmt(item.preco_promocional)}</div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-900">R$ {fmt(item.preco)}</div>
            )}
          </div>
        </div>
        {modoDelivery && onAdicionarSacola && (
          <button
            onClick={() => onAdicionarSacola(item)}
            className="mt-3 w-full bg-orange-500 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            🛒 Adicionar
          </button>
        )}
      </div>
    )
  }

  if (layout === 'foto-esquerda') {
    return (
      <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
        <div className="flex gap-3">
          <div
            className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={() => item.foto_url && onAbrirLightbox(item.foto_url)}
          >
            {item.foto_url ? (
              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover hover:scale-105 transition" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-center gap-1">
                {codigoElem}
                <h3 className="font-semibold text-gray-900">{nomeCompleto}</h3>
                {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1">Promoção</span>}
              </div>
              <div className="text-right">
                {promocao ? (
                  <>
                    <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                    <div className="text-lg font-bold text-green-600">R$ {fmt(item.preco_promocional)}</div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-gray-900">R$ {fmt(item.preco)}</div>
                )}
              </div>
            </div>
            {item.descricao && <p className="text-sm text-gray-600 mt-1 line-clamp-2" whitespace-pre-wraps>{item.descricao}</p>}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>
                ))}
              </div>
            )}
            {modoDelivery && onAdicionarSacola && (
              <button
                onClick={() => onAdicionarSacola(item)}
                className="mt-2 bg-orange-500 text-white text-sm px-3 py-1 rounded-full hover:bg-orange-600 transition"
              >
                🛒 Adicionar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // layout === 'foto-topo'
  return (
    <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
      {item.foto_url && (
        <div
          className="w-full h-40 mb-3 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => onAbrirLightbox(item.foto_url)}
        >
          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover hover:scale-105 transition" />
        </div>
      )}
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {codigoElem}
          <h3 className="font-semibold text-gray-900">{nomeCompleto}</h3>
          {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1">Promoção</span>}
        </div>
        <div className="text-right">
          {promocao ? (
            <>
              <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
              <div className="text-lg font-bold text-green-600">R$ {fmt(item.preco_promocional)}</div>
            </>
          ) : (
            <div className="text-lg font-bold text-gray-900">R$ {fmt(item.preco)}</div>
          )}
        </div>
      </div>
      {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>
          ))}
        </div>
      )}
      {modoDelivery && onAdicionarSacola && (
        <button
          onClick={() => onAdicionarSacola(item)}
          className="mt-3 w-full bg-orange-500 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          🛒 Adicionar
        </button>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------
export default function MenuDigital() {
  const params = useParams()
  const shortUrl = params.shortUrl as string

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [tema, setTema] = useState('raiz-brasileira')
  const [layoutCardapio, setLayoutCardapio] = useState<'sem-foto' | 'foto-esquerda' | 'foto-topo'>('foto-esquerda')
  const [categoriaAtiva, setCategoriaAtiva] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<any[]>([])
  const [statusAberto, setStatusAberto] = useState({ aberto: false, texto: '', exibir: false })
  const [modoDelivery, setModoDelivery] = useState(false)
  const [temItensDelivery, setTemItensDelivery] = useState(false)

  const sacola = useSacola()
  const [sacolaAberta, setSacolaAberta] = useState(false)
  const [finalizarAberto, setFinalizarAberto] = useState(false)

  const carregarMenu = useCallback(async () => {
    if (!shortUrl) return
    setLoading(true)
    try {
      const { data: estab, error: erroEstab } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('qrcode_short_url', shortUrl)
        .eq('ativo', true)
        .single()

      if (erroEstab || !estab) {
        setErro('Cardápio não encontrado')
        setLoading(false)
        return
      }

      setEstabelecimento(estab)

      supabase.from('estabelecimentos').update({ scans_qrcode: (estab.scans_qrcode || 0) + 1 }).eq('id', estab.id).then()

      const { data: horariosData } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .eq('estabelecimento_id', estab.id)
        .order('dia_semana')
      if (horariosData) setHorarios(horariosData)

      const { data: menu } = await supabase
        .from('menus')
        .select('id, tema, layout_cardapio')
        .eq('estabelecimento_id', estab.id)
        .eq('ativo', true)
        .single()

      if (menu) {
        setTema(menu.tema || 'raiz-brasileira')
        setLayoutCardapio(menu.layout_cardapio || 'foto-esquerda')

        const { data: cats } = await supabase
          .from('categorias')
          .select('*, itens_cardapio(*)')
          .eq('menu_id', menu.id)
          .order('ordem')

        if (cats) {
          const todasCats = cats.map((cat: any) => ({
            ...cat,
            itens_cardapio: (cat.itens_cardapio || []).sort((a: any, b: any) => a.ordem - b.ordem),
          }))

          const itensDelivery = todasCats.flatMap(cat =>
            cat.itens_cardapio.filter((item: any) => item.delivery_disponivel)
          )
          setTemItensDelivery(itensDelivery.length > 0)

          if (modoDelivery) {
            if (itensDelivery.length > 0) {
              setCategorias([{ id: '__delivery__', nome: '🛵 Delivery', itens_cardapio: itensDelivery }])
            } else {
              setCategorias([])
            }
          } else {
            const catsFiltradas = todasCats
              .map((cat: any) => ({
                ...cat,
                itens_cardapio: cat.itens_cardapio.filter((item: any) => item.disponivel),
              }))
              .filter((cat: any) => cat.itens_cardapio.length > 0)

            const itensPromocao = catsFiltradas.flatMap(cat =>
              cat.itens_cardapio.filter((item: any) => item.promocao_ativa && item.preco_promocional)
            )

            const categoriasFinais = []
            if (itensPromocao.length > 0) {
              categoriasFinais.push({
                id: '__promocoes__',
                nome: '🎉 Promoções',
                eh_promocao: true,
                itens_cardapio: itensPromocao,
              })
            }

            catsFiltradas.forEach((cat: any) => {
              if (cat.itens_cardapio.length > 0) {
                categoriasFinais.push(cat)
              }
            })

            setCategorias(categoriasFinais)
          }
        }
      }
    } catch (e: any) {
      setErro('Erro ao carregar o cardápio')
    } finally {
      setLoading(false)
    }
  }, [shortUrl, modoDelivery])

  useEffect(() => {
    carregarMenu()
  }, [carregarMenu])

  useEffect(() => {
    setStatusAberto(isEstabelecimentoAberto(horarios))
    if (horarios.length > 0) {
      const interval = setInterval(() => setStatusAberto(isEstabelecimentoAberto(horarios)), 60000)
      return () => clearInterval(interval)
    }
  }, [horarios])

  // Scroll spy com offset ajustado para o novo header não fixo
  useEffect(() => {
    if (categorias.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCategoriaAtiva(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px' } // Ajustado para compensar os chips fixos
    )
    categorias.forEach((cat) => {
      const el = document.getElementById(cat.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [categorias])

  const handleScrollParaCategoria = (id: string) => {
    setCategoriaAtiva(id)
    const el = document.getElementById(id)
    if (el) {
      const yOffset = -70 // altura aproximada dos chips fixos (ajuste conforme seu layout)
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleAdicionarSacola = (item: any) => {
    sacola.adicionarItem({
      id: item.id,
      nome: item.codigo ? `${item.codigo} - ${item.nome}` : item.nome,
      preco: item.preco,
      preco_promocional: item.preco_promocional,
    })
    setSacolaAberta(true)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
  if (erro || !estabelecimento) return <div className="min-h-screen flex items-center justify-center"><p>😕 Cardápio não encontrado</p></div>

  const categoriasNav = categorias.map((cat) => ({ nome: cat.nome, id: cat.id }))

  return (
    <div className={`min-h-screen menu-container tema-${tema}`}>
      {/* 
        Cabeçalho – NÃO é mais sticky. Rola junto com a página.
      */}
      <header className="bg-white/90 backdrop-blur shadow-sm border-b-2" style={{ borderColor: 'var(--menu-accent)' }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>{estabelecimento.nome}</h1>
            <p className="text-sm opacity-75" style={{ color: 'var(--menu-text)' }}>
              {estabelecimento.tipo_cozinha} • {estabelecimento.bairro}
            </p>
            {statusAberto.exibir && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${statusAberto.aberto ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.texto}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {estabelecimento.recursos_ativos?.includes('delivery') && temItensDelivery && (
              <button
                onClick={() => { setModoDelivery(!modoDelivery); if (modoDelivery) sacola.limparSacola() }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${modoDelivery ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                🛵 {modoDelivery ? 'Delivery ON' : 'Delivery'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 
        Chips de categorias – AGORA SÃO STICKY TOP-0.
        Ficam fixos no topo da tela ao rolar.
      */}
      {categoriasNav.length > 1 && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categoriasNav.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleScrollParaCategoria(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  categoriaAtiva === cat.id
                    ? 'bg-[var(--menu-accent)] text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {categorias.length > 0 ? (
          categorias.map((categoria: any) => (
            <section key={categoria.id} id={categoria.id} className="mb-8 scroll-mt-24">
              <div className="mb-4 pb-2 border-b-2" style={{ borderColor: categoria.eh_promocao ? 'var(--menu-accent)' : '#ccc' }}>
                <h2 className={`text-xl font-bold flex items-center gap-2 ${categoria.eh_promocao ? 'text-red-600' : ''}`} style={{ color: categoria.eh_promocao ? undefined : 'var(--menu-text)' }}>
                  {categoria.nome}
                  {categoria.eh_promocao && <span className="text-sm animate-pulse">🔥</span>}
                </h2>
                {categoria.descricao && <p className="text-sm opacity-75 mt-1">{categoria.descricao}</p>}
              </div>
              <div className="space-y-3">
                {categoria.itens_cardapio.map((item: any) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    layout={layoutCardapio}
                    onAbrirLightbox={setLightboxSrc}
                    modoDelivery={modoDelivery}
                    onAdicionarSacola={modoDelivery ? handleAdicionarSacola : undefined}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">Nenhum item disponível no momento.</div>
        )}
      </main>

      {/* Botão flutuante da sacola (apenas modo delivery) */}
      {modoDelivery && (
        <button
          onClick={() => setSacolaAberta(true)}
          className="fixed bottom-6 right-6 z-40 bg-green-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
        >
          🛒
          {sacola.totalItens > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {sacola.totalItens}
            </span>
          )}
        </button>
      )}

      {/* Rodapé */}
      <footer className="bg-gray-100 py-6 mt-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-75">Cardápio digital • {estabelecimento.nome}</p>
          <p className="text-xs opacity-50 mt-1">menu.salvador.br/menu/{shortUrl}</p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} alt="Foto do item" onClose={() => setLightboxSrc(null)} />}

      {/* Sacola Drawer */}
      <SacolaDrawer
        aberto={sacolaAberta}
        itens={sacola.itens}
        total={sacola.total}
        onFechar={() => setSacolaAberta(false)}
        onRemover={sacola.removerItem}
        onAlterarQuantidade={sacola.alterarQuantidade}
        onFinalizar={() => { setSacolaAberta(false); setFinalizarAberto(true) }}
      />

      {/* Modal de finalização */}
      <FinalizarPedidoModal
        aberto={finalizarAberto}
        onFechar={() => setFinalizarAberto(false)}
        total={sacola.total}
        itens={sacola.itens.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          preco: item.preco_promocional && item.preco_promocional < item.preco ? item.preco_promocional : item.preco,
        }))}
        whatsappEstabelecimento={estabelecimento.whatsapp || ''}
      />
    </div>
  )
}