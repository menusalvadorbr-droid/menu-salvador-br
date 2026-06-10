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

// Componente ItemCard – agora com suporte completo ao tema
const ItemCard = memo(function ItemCard({
  item,
  layout,
  onAbrirLightbox,
  modoDelivery,
  onAdicionarSacola,
  idioma,
  temaConfig,
}: {
  item: any
  layout: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  onAbrirLightbox: (src: string) => void
  modoDelivery: boolean
  onAdicionarSacola?: (item: any) => void
  idioma: string
  temaConfig?: any
}) {
  const promocao = item.promocao_ativa && item.preco_promocional
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
  const nomeExibicao = item.codigo ? `${item.codigo} - ${getTextItem(item, idioma, 'nome')}` : getTextItem(item, idioma, 'nome')
  const tagsExibidas = item[`tags_${idioma}`] || item.tags || []

  // Estilos do tema (fallback para variáveis CSS)
  const titleColor = temaConfig?.title_color || 'var(--theme-title-color)'
  const descColor = temaConfig?.description_color || 'var(--theme-description-color)'
  const priceColor = temaConfig?.price_color || 'var(--theme-price-color)'
  const promoPriceColor = temaConfig?.promo_price_color || 'var(--theme-promo-price-color)'
  const tagBg = temaConfig?.tag_bg_color || 'var(--theme-tag-bg)'
  const tagText = temaConfig?.tag_text_color || 'var(--theme-tag-text)'
  const btnBg = temaConfig?.button_bg_color || 'var(--theme-button-bg)'
  const btnText = temaConfig?.button_text_color || 'var(--theme-button-text)'
  const fontFamily = temaConfig?.font_family || 'var(--theme-font)'

  const titleStyle = { color: titleColor, fontFamily }
  const descriptionStyle = { color: descColor, fontFamily }
  const priceStyle = { color: priceColor, fontFamily }
  const promoPriceStyle = { color: promoPriceColor, fontFamily }
  const tagStyle = { backgroundColor: tagBg, color: tagText, fontFamily }
  const buttonStyle = { backgroundColor: btnBg, color: btnText, fontFamily }

  if (layout === 'sem-foto') {
    return (
      <div className={`p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-100 shadow-sm'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold" style={titleStyle}>{nomeExibicao}</h3>
              {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">Promoção</span>}
            </div>
            {getTextItem(item, idioma, 'descricao') && (
              <div className="text-sm mt-1" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />
            )}
            {tagsExibidas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsExibidas.map((tag: string) => (
                  <span key={tag} className="text-xs border px-2 py-0.5 rounded-full" style={tagStyle}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            {promocao ? (
              <>
                <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                <div className="text-lg font-bold" style={promoPriceStyle}>R$ {fmt(item.preco_promocional)}</div>
              </>
            ) : (
              <div className="text-lg font-bold" style={priceStyle}>R$ {fmt(item.preco)}</div>
            )}
          </div>
        </div>
        {modoDelivery && onAdicionarSacola && (
          <button
            onClick={() => onAdicionarSacola(item)}
            className="mt-3 w-full py-1.5 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={buttonStyle}
          >
            🛒 Adicionar
          </button>
        )}
      </div>
    )
  }

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
                <h3 className="font-semibold" style={titleStyle}>{nomeExibicao}</h3>
                {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
              </div>
              <div className="text-right">
                {promocao ? (
                  <>
                    <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                    <div className="text-lg font-bold" style={promoPriceStyle}>R$ {fmt(item.preco_promocional)}</div>
                  </>
                ) : (
                  <div className="text-lg font-bold" style={priceStyle}>R$ {fmt(item.preco)}</div>
                )}
              </div>
            </div>
            {getTextItem(item, idioma, 'descricao') && (
              <div className="text-sm mt-1 line-clamp-2" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />
            )}
            {tagsExibidas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsExibidas.map((tag: string) => (
                  <span key={tag} className="text-xs border px-2 py-0.5 rounded-full" style={tagStyle}>{tag}</span>
                ))}
              </div>
            )}
            {modoDelivery && onAdicionarSacola && (
              <button
                onClick={() => onAdicionarSacola(item)}
                className="mt-2 text-sm px-3 py-1 rounded-full hover:opacity-90 transition"
                style={buttonStyle}
              >
                🛒 Adicionar
              </button>
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
          <h3 className="font-semibold" style={titleStyle}>{nomeExibicao}</h3>
          {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
        </div>
        <div className="text-right">
          {promocao ? (
            <>
              <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
              <div className="text-lg font-bold" style={promoPriceStyle}>R$ {fmt(item.preco_promocional)}</div>
            </>
          ) : (
            <div className="text-lg font-bold" style={priceStyle}>R$ {fmt(item.preco)}</div>
          )}
        </div>
      </div>
      {getTextItem(item, idioma, 'descricao') && (
        <div className="text-sm mt-1" style={descriptionStyle} dangerouslySetInnerHTML={{ __html: getTextItem(item, idioma, 'descricao') }} />
      )}
      {tagsExibidas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tagsExibidas.map((tag: string) => (
            <span key={tag} className="text-xs border px-2 py-0.5 rounded-full" style={tagStyle}>{tag}</span>
          ))}
        </div>
      )}
      {modoDelivery && onAdicionarSacola && (
        <button
          onClick={() => onAdicionarSacola(item)}
          className="mt-3 w-full py-1.5 rounded-lg text-sm font-medium transition hover:opacity-90"
          style={buttonStyle}
        >
          🛒 Adicionar
        </button>
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
  const [temaConfig, setTemaConfig] = useState<any>(null) // detalhes do tema carregado

  const sacola = useSacola()
  const [sacolaAberta, setSacolaAberta] = useState(false)
  const [finalizarAberto, setFinalizarAberto] = useState(false)
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

        // ✅ CORREÇÃO 1: Buscar detalhes do tema SEMPRE, não apenas se não for 'raiz-brasileira'
        let temaDetalhes = null
        if (menu.tema) {
          const { data: temaData } = await supabase
            .from('temas')
            .select('*')
            .eq('slug', menu.tema)
            .maybeSingle() // usar maybeSingle evita erro se não encontrar
          if (temaData) temaDetalhes = temaData
        }
        setTemaConfig(temaDetalhes)

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

  // ✅ CORREÇÃO 2: Definir variáveis CSS customizadas e estilos do container
  const themeStyles = {
    '--theme-bg': temaConfig?.background_color || '#fef9e8',
    '--theme-bg-image': temaConfig?.background_image ? `url(${temaConfig.background_image})` : 'none',
    '--theme-primary': temaConfig?.primary_color || '#c7a252',
    '--theme-secondary': temaConfig?.secondary_color || '#8b5a2b',
    '--theme-text': temaConfig?.text_color || '#2c2c2c',
    '--theme-title-color': temaConfig?.title_color || '#2c2c2c',
    '--theme-description-color': temaConfig?.description_color || '#5a5a5a',
    '--theme-price-color': temaConfig?.price_color || '#2c2c2c',
    '--theme-promo-price-color': temaConfig?.promo_price_color || '#c7a252',
    '--theme-tag-bg': temaConfig?.tag_bg_color || '#e8e8e8',
    '--theme-tag-text': temaConfig?.tag_text_color || '#2c2c2c',
    '--theme-button-bg': temaConfig?.button_bg_color || '#c7a252',
    '--theme-button-text': temaConfig?.button_text_color || '#ffffff',
    '--theme-font': temaConfig?.font_family || 'system-ui, sans-serif',
  } as React.CSSProperties

  // Estilo inline do container (combina background e fonte global)
  const containerStyle: React.CSSProperties = {
    ...themeStyles,
    backgroundColor: temaConfig?.background_color || '#fef9e8',
    backgroundImage: temaConfig?.background_image ? `url(${temaConfig.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    color: temaConfig?.text_color || '#2c2c2c',
    fontFamily: temaConfig?.font_family || 'system-ui, sans-serif',
  }

  return (
    <div className="min-h-screen menu-container" style={containerStyle}>
      {/* Cabeçalho adaptado ao tema */}
      <div
        className="relative w-full pt-6 pb-4"
        style={{
          backgroundColor: temaConfig?.primary_color || '#c7a252',
          color: temaConfig?.button_text_color || '#ffffff',
          backgroundImage: urlCapa ? `url(${urlCapa})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {urlCapa && <div className="absolute inset-0 bg-black/40" />}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: themeStyles['--theme-font'] }}>
                {estabelecimento.nome_fantasia || estabelecimento.nome}
              </h1>
              <p className="text-sm opacity-90">{estabelecimento.tipo_cozinha} • {estabelecimento.bairro}</p>
              {statusAberto.exibir && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${statusAberto.aberto ? 'bg-green-500/30 text-white' : 'bg-red-500/30 text-white'}`}>
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
                      className={`px-2 py-1 rounded-full text-xs font-medium transition ${idiomaAtual === idioma ? 'bg-white text-gray-800' : 'text-white hover:bg-white/20'}`}
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
                  className="px-4 py-2 rounded-full text-sm font-medium transition bg-white/20 text-white hover:bg-white/30"
                >
                  🛵 {modoDelivery ? 'Delivery ON' : 'Delivery'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chips de categorias – cores do tema */}
      {categoriasNav.length > 1 && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b">
          <div ref={chipsRef} className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categoriasNav.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleScrollParaCategoria(cat.id)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: categoriaAtiva === cat.id ? (temaConfig?.primary_color || '#c7a252') : '#f3f4f6',
                  color: categoriaAtiva === cat.id ? (temaConfig?.button_text_color || '#ffffff') : (temaConfig?.text_color || '#374151'),
                  fontFamily: themeStyles['--theme-font'],
                }}
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
          categorias.map((categoria) => (
            <section key={categoria.id} id={categoria.id} className="mb-8 scroll-mt-24">
              <div className="mb-4 pb-2 border-b-2" style={{ borderColor: categoria.eh_promocao ? '#ef4444' : (temaConfig?.primary_color || '#c7a252') }}>
                <h2
                  className={`text-xl font-bold flex items-center gap-2 ${categoria.eh_promocao ? 'text-red-600' : ''}`}
                  style={categoria.eh_promocao ? {} : { color: temaConfig?.primary_color || '#c7a252', fontFamily: themeStyles['--theme-font'] }}
                >
                  {categoria.nome}
                  {categoria.eh_promocao && <span className="text-sm animate-pulse">🔥</span>}
                </h2>
                {categoria.descricao && <p className="text-sm opacity-75 mt-1" style={{ fontFamily: themeStyles['--theme-font'] }}>{categoria.descricao}</p>}
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
                    temaConfig={temaConfig}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">Nenhum item disponível no momento.</div>
        )}
      </main>

      {/* Botão flutuante da sacola */}
      {modoDelivery && (
        <button
          onClick={() => setSacolaAberta(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl"
          style={{
            backgroundColor: temaConfig?.button_bg_color || '#22c55e',
            color: temaConfig?.button_text_color || '#ffffff',
          }}
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
      <footer className="py-6 mt-8 border-t" style={{ backgroundColor: temaConfig?.background_color || '#f3f4f6', borderColor: temaConfig?.primary_color || '#e5e7eb' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-75" style={{ fontFamily: themeStyles['--theme-font'] }}>Cardápio digital • {estabelecimento.nome}</p>
          <p className="text-xs opacity-50 mt-1" style={{ fontFamily: themeStyles['--theme-font'] }}>menu.salvador.br/menu/{shortUrl}</p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxSrc && <Lightbox src={lightboxSrc} alt="Foto do item" onClose={() => setLightboxSrc(null)} />}

      {/* Sacola Drawer e modal */}
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