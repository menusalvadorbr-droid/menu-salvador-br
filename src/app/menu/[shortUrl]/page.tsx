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
// Subcomponentes
// ----------------------------------------------------------------

function Cabecalho({
  estabelecimento,
  statusAberto,
  modoDelivery,
  temItensDelivery,
  onToggleDelivery,
}: {
  estabelecimento: any
  statusAberto: { aberto: boolean; texto: string; exibir: boolean }
  modoDelivery: boolean
  temItensDelivery: boolean
  onToggleDelivery: () => void
}) {
  return (
    <header
      className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm border-b-2"
      style={{ borderColor: 'var(--menu-accent)' }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>
            {estabelecimento.nome}
          </h1>
          <p className="text-sm opacity-75" style={{ color: 'var(--menu-text)' }}>
            {estabelecimento.tipo_cozinha} • {estabelecimento.bairro}
          </p>
          {statusAberto.exibir && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                statusAberto.aberto
                  ? 'bg-green-500/20 text-green-700'
                  : 'bg-red-500/20 text-red-700'
              }`}
            >
              {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.texto}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {estabelecimento.recursos_ativos?.includes('delivery') && temItensDelivery && (
            <button
              onClick={onToggleDelivery}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                modoDelivery
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🛵 {modoDelivery ? 'Delivery ON' : 'Delivery'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function ChipsCategorias({
  categorias,
  categoriaAtiva,
  onSelect,
}: {
  categorias: { nome: string; id: string }[]
  categoriaAtiva: string
  onSelect: (id: string) => void
}) {
  const chipsRef = useRef<HTMLDivElement>(null)

  if (categorias.length <= 1) return null

  useEffect(() => {
    if (categoriaAtiva && chipsRef.current) {
      const chipAtivo = chipsRef.current.querySelector(`[data-cat="${categoriaAtiva}"]`)
      if (chipAtivo) {
        chipAtivo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [categoriaAtiva])

  return (
    <div className="sticky top-[73px] z-40 bg-white/95 backdrop-blur border-b">
      <div
        ref={chipsRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categorias.map((cat) => (
          <button
            key={cat.id}
            data-cat={cat.id}
            onClick={() => onSelect(cat.id)}
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
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

function ItemCard({
  item,
  onAbrirLightbox,
  modoDelivery,
  onAdicionarSacola,
}: {
  item: any
  onAbrirLightbox: (src: string) => void
  modoDelivery: boolean
  onAdicionarSacola?: (item: any) => void
}) {
  const promocao = item.promocao_ativa && item.preco_promocional

  return (
    <div
      className={`p-4 rounded-xl transition ${
        promocao
          ? 'bg-red-50 border-2 border-red-200'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      {item.foto_url && (
        <div
          className="w-full h-40 mb-3 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => onAbrirLightbox(item.foto_url)}
        >
          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover hover:scale-105 transition" />
        </div>
      )}

      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {item.codigo && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono">
              #{item.codigo}
            </span>
          )}
          <h3 className="font-semibold text-gray-900">{item.nome}</h3>
          {item.promocao_ativa && (
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
              {item.promocao_titulo || 'Promoção'}
            </span>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {promocao ? (
            <>
              <div className="text-xs text-gray-400 line-through">
                R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xl font-bold text-green-600">
                R$ {item.preco_promocional?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </>
          ) : (
            <div className="text-lg font-bold text-gray-900">
              R$ {item.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
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

function CategoriaCard({
  categoria,
  temPromocao,
  onAbrirLightbox,
  modoDelivery,
  onAdicionarSacola,
}: {
  categoria: any
  temPromocao: boolean
  onAbrirLightbox: (src: string) => void
  modoDelivery: boolean
  onAdicionarSacola?: (item: any) => void
}) {
  const itens = categoria.itens_cardapio || []
  if (itens.length === 0) return null

  return (
    <section id={categoria.id} className="mb-8 scroll-mt-40">
      <div className="mb-4 pb-2 border-b-2" style={{ borderColor: temPromocao ? 'var(--menu-accent)' : '#ccc' }}>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${temPromocao ? 'text-red-600' : ''}`} style={{ color: temPromocao ? undefined : 'var(--menu-text)' }}>
          {categoria.nome}
          {temPromocao && <span className="text-sm animate-pulse">🔥</span>}
        </h2>
        {categoria.descricao && (
          <p className="text-sm opacity-75 mt-1" style={{ color: 'var(--menu-text)' }}>{categoria.descricao}</p>
        )}
      </div>
      <div className="space-y-3">
        {itens.map((item: any) => (
          <ItemCard
            key={item.id}
            item={item}
            onAbrirLightbox={onAbrirLightbox}
            modoDelivery={modoDelivery}
            onAdicionarSacola={modoDelivery ? onAdicionarSacola : undefined}
          />
        ))}
      </div>
    </section>
  )
}

function Rodape({ estabelecimento, shortUrl }: { estabelecimento: any; shortUrl: string }) {
  return (
    <footer className="bg-gray-100 py-6 mt-8 border-t" style={{ borderColor: 'var(--menu-border)' }}>
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm opacity-75" style={{ color: 'var(--menu-text)' }}>Cardápio digital • {estabelecimento.nome}</p>
        <p className="text-xs opacity-50 mt-1" style={{ color: 'var(--menu-text)' }}>menu.salvador.br/menu/{shortUrl}</p>
      </div>
    </footer>
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
  const [categoriaAtiva, setCategoriaAtiva] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [horarios, setHorarios] = useState<any[]>([])
  const [statusAberto, setStatusAberto] = useState({ aberto: false, texto: '', exibir: false })
  const [modoDelivery, setModoDelivery] = useState(false)
  const [temItensDelivery, setTemItensDelivery] = useState(false)
  const [sacolaAberta, setSacolaAberta] = useState(false)
  const [finalizarAberto, setFinalizarAberto] = useState(false)

  const sacola = useSacola()

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

      supabase.from('estabelecimentos').update({ scans_qrcode: (estab.scans_qrcode || 0) + 1 }).eq('id', estab.id).then(() => {})

      const { data: horariosData } = await supabase.from('horarios_funcionamento').select('*').eq('estabelecimento_id', estab.id).order('dia_semana')
      if (horariosData) setHorarios(horariosData)

      const { data: menu } = await supabase.from('menus').select('id, tema').eq('estabelecimento_id', estab.id).eq('ativo', true).single()

      if (menu) {
        if (menu.tema) setTema(menu.tema)

        const { data: cats } = await supabase.from('categorias').select('*, itens_cardapio(*)').eq('menu_id', menu.id).order('ordem')

        if (cats) {
          const todasCats = cats.map((cat: any) => ({
            ...cat,
            itens_cardapio: (cat.itens_cardapio || []).sort((a: any, b: any) => a.ordem - b.ordem),
          }))

          const itensDelivery = todasCats.flatMap(cat => cat.itens_cardapio.filter((item: any) => item.delivery_disponivel))
          setTemItensDelivery(itensDelivery.length > 0)

          if (modoDelivery) {
            if (itensDelivery.length > 0) {
              setCategorias([{ id: '__delivery__', nome: '🛵 Delivery', itens_cardapio: itensDelivery }])
            } else {
              setCategorias([])
            }
          } else {
            const catsFiltradas = todasCats
              .map((cat: any) => ({ ...cat, itens_cardapio: cat.itens_cardapio.filter((item: any) => item.disponivel) }))
              .filter((cat: any) => cat.itens_cardapio.length > 0)

            const itensPromocao = catsFiltradas.flatMap(cat => cat.itens_cardapio.filter((item: any) => item.promocao_ativa))

            const categoriasFinais = []
            if (itensPromocao.length > 0) {
              categoriasFinais.push({ id: '__promocoes__', nome: '🎉 Promoções', eh_promocao: true, fixar_topo: true, itens_cardapio: itensPromocao })
            }

            catsFiltradas.forEach((cat: any) => {
              const itensSemPromo = cat.itens_cardapio.filter((item: any) => !item.promocao_ativa)
              if (itensSemPromo.length > 0) categoriasFinais.push({ ...cat, itens_cardapio: itensSemPromo })
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

  useEffect(() => { carregarMenu() }, [carregarMenu])

  useEffect(() => {
    setStatusAberto(isEstabelecimentoAberto(horarios))
    if (horarios.length > 0) {
      const interval = setInterval(() => setStatusAberto(isEstabelecimentoAberto(horarios)), 60000)
      return () => clearInterval(interval)
    }
  }, [horarios])

  // Scroll spy
  useEffect(() => {
    if (categorias.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCategoriaAtiva(entry.target.id)
          }
        })
      },
      { rootMargin: '-150px 0px -70% 0px' }
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
      const yOffset = -140
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleAdicionarSacola = (item: any) => {
    sacola.adicionarItem({ id: item.id, nome: item.nome, preco: item.preco, preco_promocional: item.preco_promocional })
    setSacolaAberta(true)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
  if (erro || !estabelecimento) return <div className="min-h-screen flex items-center justify-center"><p>😕 Cardápio não encontrado</p></div>

  const categoriasNav = categorias.map((cat) => ({ nome: cat.nome, id: cat.id }))

  return (
    <div className={`min-h-screen menu-container tema-${tema}`}>
      <Cabecalho
        estabelecimento={estabelecimento}
        statusAberto={statusAberto}
        modoDelivery={modoDelivery}
        temItensDelivery={temItensDelivery}
        onToggleDelivery={() => { setModoDelivery(!modoDelivery); if (modoDelivery) sacola.limparSacola() }}
      />

      <ChipsCategorias categorias={categoriasNav} categoriaAtiva={categoriaAtiva} onSelect={handleScrollParaCategoria} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {categorias.length > 0 ? (
          categorias.map((categoria: any) => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              temPromocao={categoria.eh_promocao || categoria.itens_cardapio.some((i: any) => i.promocao_ativa)}
              onAbrirLightbox={setLightboxSrc}
              modoDelivery={modoDelivery}
              onAdicionarSacola={modoDelivery ? handleAdicionarSacola : undefined}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">Nenhum item disponível no momento.</div>
        )}
      </main>

      {modoDelivery && (
        <button onClick={() => setSacolaAberta(true)}
          className="fixed bottom-6 right-6 z-40 bg-green-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl">
          🛒
          {sacola.totalItens > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {sacola.totalItens}
            </span>
          )}
        </button>
      )}

      <Rodape estabelecimento={estabelecimento} shortUrl={shortUrl} />

      {lightboxSrc && <Lightbox src={lightboxSrc} alt="Foto do item" onClose={() => setLightboxSrc(null)} />}

      <SacolaDrawer
        aberto={sacolaAberta}
        itens={sacola.itens}
        total={sacola.total}
        onFechar={() => setSacolaAberta(false)}
        onRemover={sacola.removerItem}
        onAlterarQuantidade={sacola.alterarQuantidade}
        onFinalizar={() => { setSacolaAberta(false); setFinalizarAberto(true) }}
      />

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