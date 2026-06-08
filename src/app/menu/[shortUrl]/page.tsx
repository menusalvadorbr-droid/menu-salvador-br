// src/app/menu/[shortUrl]/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Lightbox from '@/components/ui/Lightbox'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import { useSacola } from '@/features/delivery/useSacola'
import SacolaDrawer from '@/features/delivery/SacolaDrawer'
import FinalizarPedidoModal from '@/features/delivery/FinalizarPedidoModal'
import Link from 'next/link'

// Helper para otimizar URLs do Cloudinary
function optimizeCloudinaryUrl(url: string | null, width: number, height: number, quality: number = 80): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com')) return url
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  const transformations = `q_${quality},f_auto,c_fill,w_${width},h_${height}`
  return `${parts[0]}/upload/${transformations}/${parts[1]}`
}

// Helper para obter texto traduzido
function getTextItem(item: any, idioma: string, campo: string) {
  const campoTraduzido = `${campo}_${idioma}`
  return item[campoTraduzido] || item[campo] || ''
}

// Componente memoizado ItemCard (evita re-renderizações desnecessárias)
const ItemCard = memo(function ItemCard({
  item,
  layout,
  onAbrirLightbox,
  modoDelivery,
  onAdicionarSacola,
  idioma,
}: {
  item: any
  layout: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  onAbrirLightbox: (src: string) => void
  modoDelivery: boolean
  onAdicionarSacola?: (item: any) => void
  idioma: string
}) {
  const promocao = item.promocao_ativa && item.preco_promocional
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
  const nomeExibicao = item.codigo ? `${item.codigo} - ${getTextItem(item, idioma, 'nome')}` : getTextItem(item, idioma, 'nome')
  const tagsExibidas = item[`tags_${idioma}`] || item.tags || []

  // Layout sem foto
  if (layout === 'sem-foto') {
    return (
      <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
              {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">Promoção</span>}
            </div>
            {getTextItem(item, idioma, 'descricao') && <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />}
            {tagsExibidas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsExibidas.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>)}
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
          <button onClick={() => onAdicionarSacola(item)} className="mt-3 w-full bg-orange-500 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition">
            🛒 Adicionar
          </button>
        )}
      </div>
    )
  }

  // Layout foto à esquerda
  if (layout === 'foto-esquerda') {
    const imgUrl = optimizeCloudinaryUrl(item.foto_url, 80, 80)
    return (
      <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer" onClick={() => item.foto_url && onAbrirLightbox(item.foto_url)}>
            {imgUrl ? <img src={imgUrl} alt={item.nome} className="w-full h-full object-cover hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
                {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
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
            {getTextItem(item, idioma, 'descricao') && <p className="text-sm text-gray-600 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />}
            {tagsExibidas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsExibidas.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>)}
              </div>
            )}
            {modoDelivery && onAdicionarSacola && (
              <button onClick={() => onAdicionarSacola(item)} className="mt-2 bg-orange-500 text-white text-sm px-3 py-1 rounded-full hover:bg-orange-600 transition">🛒 Adicionar</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // layout foto-topo
  const imgUrlTopo = optimizeCloudinaryUrl(item.foto_url, 400, 160)
  return (
    <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
      {item.foto_url && (
        <div className="w-full h-40 mb-3 rounded-lg overflow-hidden cursor-pointer" onClick={() => onAbrirLightbox(item.foto_url)}>
          <img src={imgUrlTopo} alt={item.nome} className="w-full h-full object-cover hover:scale-105 transition" />
        </div>
      )}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
          {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
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
      {getTextItem(item, idioma, 'descricao') && <p className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />}
      {tagsExibidas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tagsExibidas.map((tag: string) => <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">{tag}</span>)}
        </div>
      )}
      {modoDelivery && onAdicionarSacola && (
        <button onClick={() => onAdicionarSacola(item)} className="mt-3 w-full bg-orange-500 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition">🛒 Adicionar</button>
      )}
    </div>
  )
})

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
  const [idiomasDisponiveis, setIdiomasDisponiveis] = useState<string[]>(['pt'])
  const [idiomaAtual, setIdiomaAtual] = useState('pt')

  const sacola = useSacola()
  const [sacolaAberta, setSacolaAberta] = useState(false)
  const [finalizarAberto, setFinalizarAberto] = useState(false)
  
  // Ref para controlar se o scan já foi registrado nesta sessão (evita múltiplos incrementos)
  const scanRegistrado = useRef(false)
  const chipsRef = useRef<HTMLDivElement>(null)

  const handleAdicionarSacola = useCallback((item: any) => {
    sacola.adicionarItem({
      id: item.id,
      nome: item.codigo ? `${item.codigo} - ${item.nome}` : item.nome,
      preco: item.preco,
      preco_promocional: item.preco_promocional,
    })
    setSacolaAberta(true)
  }, [sacola])

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
      setIdiomasDisponiveis(estab.idiomas_ativos || ['pt'])
      
      // Incrementar scan APENAS UMA VEZ por sessão (controle via ref)
      if (!scanRegistrado.current) {
        scanRegistrado.current = true
        supabase.from('estabelecimentos').update({ scans_qrcode: (estab.scans_qrcode || 0) + 1 }).eq('id', estab.id).then()
      }

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

          const itensDelivery = todasCats.flatMap(cat => cat.itens_cardapio.filter((item: any) => item.delivery_disponivel))
          setTemItensDelivery(itensDelivery.length > 0)

          if (modoDelivery) {
            setCategorias(itensDelivery.length > 0 ? [{ id: '__delivery__', nome: '🛵 Delivery', itens_cardapio: itensDelivery }] : [])
          } else {
            const catsFiltradas = todasCats
              .map((cat: any) => ({
                ...cat,
                itens_cardapio: cat.itens_cardapio.filter((item: any) => item.disponivel),
              }))
              .filter((cat: any) => cat.itens_cardapio.length > 0)

            const itensPromocao = catsFiltradas.flatMap(cat => cat.itens_cardapio.filter((item: any) => item.promocao_ativa && item.preco_promocional))
            const categoriasFinais = []
            if (itensPromocao.length > 0) {
              categoriasFinais.push({
                id: '__promocoes__',
                nome: '🎉 Promoções',
                eh_promocao: true,
                fixar_topo: true,
                itens_cardapio: itensPromocao,
              })
            }
            catsFiltradas.forEach((cat: any) => categoriasFinais.push(cat))
            setCategorias(categoriasFinais)
          }
        }
      }
    } catch (e: any) {
      console.error(e)
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
    if (horarios.length) {
      const interval = setInterval(() => setStatusAberto(isEstabelecimentoAberto(horarios)), 60000)
      return () => clearInterval(interval)
    }
  }, [horarios])

  useEffect(() => {
    if (categorias.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCategoriaAtiva(entry.target.id)
        })
      },
      { rootMargin: '-80px 0px -70% 0px' }
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
      const yOffset = -70
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Carregando cardápio...</div>
      </div>
    )
  }
  if (erro || !estabelecimento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">😕 {erro || 'Cardápio não encontrado'}</div>
      </div>
    )
  }

  const categoriasNav = categorias.map((cat) => ({ nome: cat.nome, id: cat.id }))
  const urlCapa = optimizeCloudinaryUrl(estabelecimento.foto_capa, 1200, 400, 80)
  const mapaIdiomaBandeira: Record<string, string> = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷' }

  return (
    <div className={`min-h-screen menu-container tema-${tema}`}>
      {/* Cabeçalho com foto de capa (se existir) */}
      {urlCapa ? (
        <div className="relative w-full h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${urlCapa})` }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="container mx-auto px-4 py-6 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-white">{estabelecimento.nome_fantasia || estabelecimento.nome}</h1>
                <p className="text-sm text-white/80">{estabelecimento.tipo_cozinha} • {estabelecimento.bairro}</p>
                {statusAberto.exibir && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${statusAberto.aberto ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                    {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.texto}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {idiomasDisponiveis.length > 1 && (
                  <div className="flex gap-1 bg-white/20 rounded-full p-1 backdrop-blur-sm">
                    {idiomasDisponiveis.map((idioma) => (
                      <button
                        key={idioma}
                        onClick={() => setIdiomaAtual(idioma)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition ${idiomaAtual === idioma ? 'bg-orange-500 text-white' : 'text-white hover:bg-white/20'}`}
                      >
                        {mapaIdiomaBandeira[idioma]} {idioma.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
                {estabelecimento.recursos_ativos?.includes('delivery') && temItensDelivery && (
                  <button
                    onClick={() => {
                      setModoDelivery(!modoDelivery)
                      if (modoDelivery) sacola.limparSacola()
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${modoDelivery ? 'bg-orange-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    🛵 {modoDelivery ? 'Delivery ON' : 'Delivery'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cabeçalho sem foto de capa (gradiente) */
        <div className="bg-gradient-to-br from-orange-600 to-red-700 text-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold">{estabelecimento.nome_fantasia || estabelecimento.nome}</h1>
                <p className="text-sm text-white/80">{estabelecimento.tipo_cozinha} • {estabelecimento.bairro}</p>
                {statusAberto.exibir && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${statusAberto.aberto ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                    {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.texto}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {idiomasDisponiveis.length > 1 && (
                  <div className="flex gap-1 bg-white/20 rounded-full p-1 backdrop-blur-sm">
                    {idiomasDisponiveis.map((idioma) => (
                      <button
                        key={idioma}
                        onClick={() => setIdiomaAtual(idioma)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition ${idiomaAtual === idioma ? 'bg-orange-500 text-white' : 'text-white hover:bg-white/20'}`}
                      >
                        {mapaIdiomaBandeira[idioma]} {idioma.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
                {estabelecimento.recursos_ativos?.includes('delivery') && temItensDelivery && (
                  <button
                    onClick={() => {
                      setModoDelivery(!modoDelivery)
                      if (modoDelivery) sacola.limparSacola()
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${modoDelivery ? 'bg-orange-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                    🛵 {modoDelivery ? 'Delivery ON' : 'Delivery'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chips de categorias (fixo no topo ao rolar) */}
      {categoriasNav.length > 1 && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b">
          <div
            ref={chipsRef}
            className="flex gap-2 px-4 py-3 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
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

      {/* Conteúdo principal (itens do cardápio) */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {categorias.length > 0 ? (
          categorias.map((categoria) => (
            <section key={categoria.id} id={categoria.id} className="mb-8 scroll-mt-24">
              <div className="mb-4 pb-2 border-b-2" style={{ borderColor: categoria.eh_promocao ? 'var(--menu-accent)' : '#ccc' }}>
                <h2
                  className={`text-xl font-bold flex items-center gap-2 ${categoria.eh_promocao ? 'text-red-600' : ''}`}
                  style={{ color: categoria.eh_promocao ? undefined : 'var(--menu-text)' }}
                >
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
                    idioma={idiomaAtual}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">Nenhum item disponível no momento.</div>
        )}
      </main>

      {/* Botão flutuante da sacola (modo delivery) */}
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

      {/* Sacola Drawer e Modal de finalização */}
      <SacolaDrawer
        aberto={sacolaAberta}
        itens={sacola.itens}
        total={sacola.total}
        onFechar={() => setSacolaAberta(false)}
        onRemover={sacola.removerItem}
        onAlterarQuantidade={sacola.alterarQuantidade}
        onFinalizar={() => {
          setSacolaAberta(false)
          setFinalizarAberto(true)
        }}
      />
      <FinalizarPedidoModal
        aberto={finalizarAberto}
        onFechar={() => setFinalizarAberto(false)}
        total={sacola.total}
        itens={sacola.itens.map((item) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          preco: item.preco_promocional && item.preco_promocional < item.preco ? item.preco_promocional : item.preco,
        }))}
        whatsappEstabelecimento={estabelecimento.whatsapp || ''}
      />
    </div>
  )
}