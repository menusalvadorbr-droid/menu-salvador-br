'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ----------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------

function Cabecalho({ estabelecimento }: { estabelecimento: any }) {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur shadow-sm border-b-2" style={{ borderColor: 'var(--menu-accent)' }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>
            {estabelecimento.nome}
          </h1>
          <p className="text-sm opacity-75" style={{ color: 'var(--menu-text)' }}>
            {estabelecimento.tipo_cozinha} • {estabelecimento.bairro}
          </p>
        </div>
        {estabelecimento.whatsapp && (
          <a
            href={`https://wa.me/55${estabelecimento.whatsapp.replace(/\D/g, '')}?text=Olá! Vim pelo cardápio digital`}
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition flex items-center gap-1"
          >
            💬 Pedir
          </a>
        )}
      </div>
    </header>
  )
}

function ItemCard({ item }: { item: any }) {
  const promocao = item.promocao_ativa && item.preco_promocional

  return (
    <div
      className={`p-4 rounded-xl transition ${
        promocao
          ? 'bg-red-50 border-2 border-red-200'
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {/* Exibir foto se existir */}
          {item.foto_url && (
            <div className="w-full h-40 mb-3 rounded-lg overflow-hidden">
              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{item.nome}</h3>
            {item.codigo && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                #{item.codigo}
              </span>
            )}
            {item.promocao_ativa && (
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                {item.promocao_titulo || 'Promoção!'}
              </span>
            )}
          </div>
          {item.descricao && (
            <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          {promocao ? (
            <>
              <div className="text-xs text-gray-400 line-through">R$ {item.preco?.toFixed(2)}</div>
              <div className="text-xl font-bold text-green-600">R$ {item.preco_promocional?.toFixed(2)}</div>
              {item.desconto_percentual && (
                <div className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full inline-block mt-1">
                  -{item.desconto_percentual}%
                </div>
              )}
            </>
          ) : (
            <div className="text-lg font-bold text-gray-900">R$ {item.preco?.toFixed(2)}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoriaCard({
  categoria,
  temPromocao,
}: {
  categoria: any
  temPromocao: boolean
}) {
  const itens = (categoria.itens_cardapio || []).filter((item: any) => item.disponivel)

  if (itens.length === 0) return null

  return (
    <section className="mb-8">
      <div
        className="mb-4 pb-2 border-b-2"
        style={{ borderColor: temPromocao ? 'var(--menu-accent)' : '#ccc' }}
      >
        <h2
          className={`text-xl font-bold flex items-center gap-2 ${temPromocao ? 'text-red-600' : ''}`}
          style={{ color: temPromocao ? undefined : 'var(--menu-text)' }}
        >
          {categoria.nome}
          {temPromocao && <span className="text-sm animate-pulse">🔥</span>}
        </h2>
        {categoria.descricao && (
          <p className="text-sm opacity-75 mt-1" style={{ color: 'var(--menu-text)' }}>
            {categoria.descricao}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {itens.map((item: any) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">📱</div>
        <p className="text-gray-600">Carregando cardápio...</p>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Cardápio não encontrado</h1>
        <p className="text-gray-600">Este QR Code não está vinculado a nenhum estabelecimento ativo.</p>
      </div>
    </div>
  )
}

function Rodape({ estabelecimento, shortUrl }: { estabelecimento: any; shortUrl: string }) {
  return (
    <footer className="bg-gray-100 py-6 mt-8 border-t" style={{ borderColor: 'var(--menu-border)' }}>
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm opacity-75" style={{ color: 'var(--menu-text)' }}>
          Cardápio digital • {estabelecimento.nome}
        </p>
        <p className="text-xs opacity-50 mt-1" style={{ color: 'var(--menu-text)' }}>
          menu.salvador.br/menu/{shortUrl}
        </p>
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

      // Registrar scan (fire-and-forget)
      supabase
        .from('estabelecimentos')
        .update({ scans_qrcode: (estab.scans_qrcode || 0) + 1 })
        .eq('id', estab.id)
        .then(() => {})

      const { data: menu } = await supabase
        .from('menus')
        .select('id, tema')
        .eq('estabelecimento_id', estab.id)
        .eq('ativo', true)
        .single()

      if (menu) {
        if (menu.tema) setTema(menu.tema)

        const { data: cats } = await supabase
          .from('categorias')
          .select('*, itens_cardapio(*)')
          .eq('menu_id', menu.id)
          .order('ordem')

        if (cats) {
          // Filtrar apenas itens disponíveis e ordenar
          const categoriasProcessadas = cats
            .map((cat: any) => ({
              ...cat,
              itens_cardapio: (cat.itens_cardapio || [])
                .filter((item: any) => item.disponivel)
                .sort((a: any, b: any) => a.ordem - b.ordem),
            }))
            .filter((cat: any) => cat.itens_cardapio.length > 0)

          // Priorizar categorias de promoção
          const promocoes = categoriasProcessadas.filter(
            (cat: any) =>
              cat.eh_promocao || cat.itens_cardapio.some((i: any) => i.promocao_ativa)
          )
          const normais = categoriasProcessadas.filter(
            (cat: any) =>
              !cat.eh_promocao && !cat.itens_cardapio.some((i: any) => i.promocao_ativa)
          )

          setCategorias([...promocoes, ...normais])
        }
      } else {
        setErro('Menu não configurado')
      }
    } catch (e: any) {
      setErro('Erro ao carregar o cardápio')
    } finally {
      setLoading(false)
    }
  }, [shortUrl])

  useEffect(() => {
    carregarMenu()
  }, [carregarMenu])

  if (loading) return <LoadingState />
  if (erro || !estabelecimento) return <ErrorState />

  return (
    <div className={`min-h-screen menu-container tema-${tema}`}>
      <Cabecalho estabelecimento={estabelecimento} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {categorias.length > 0 ? (
          categorias.map((categoria: any) => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              temPromocao={
                categoria.eh_promocao ||
                categoria.itens_cardapio.some((i: any) => i.promocao_ativa)
              }
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            Nenhum item disponível no momento.
          </div>
        )}
      </main>

      <Rodape estabelecimento={estabelecimento} shortUrl={shortUrl} />
    </div>
  )
}