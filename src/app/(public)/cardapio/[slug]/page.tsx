import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Metadata } from 'next'

// ============================================================
// METADADOS DINÂMICOS (SEO)
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  // Buscar estabelecimento para os metadados
  const { data: estabelecimento, error } = await supabase
    .from('estabelecimentos')
    .select('nome, nome_fantasia, descricao, bairro, slug, foto_capa')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .single()

  if (error || !estabelecimento) {
    return {
      title: 'Cardápio - Menu Salvador',
      description: 'Confira o cardápio digital deste estabelecimento.',
    }
  }

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const descricao = estabelecimento.descricao || `Cardápio digital do ${nomeExibicao} em ${estabelecimento.bairro}.`
  const imageUrl = estabelecimento.foto_capa || '/default-og-image.jpg'

  return {
    title: `${nomeExibicao} - Cardápio Digital`,
    description: descricao,
    openGraph: {
      title: `${nomeExibicao} - Cardápio Digital`,
      description: descricao,
      url: `/cardapio/${slug}`,
      siteName: 'Menu Salvador',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Cardápio do ${nomeExibicao}`,
        },
      ],
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nomeExibicao} - Cardápio Digital`,
      description: descricao,
      images: [imageUrl],
    },
    alternates: {
      canonical: `/cardapio/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default async function CardapioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // 1. Buscar estabelecimento
  const { data: estabelecimento, error: estError } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .single()

  if (estError || !estabelecimento) notFound()

  // 2. Buscar tema
  let temaConfig = {}
  if (estabelecimento.tema_atual_id) {
    const { data: tema } = await supabase
      .from('temas')
      .select('config')
      .eq('id', estabelecimento.tema_atual_id)
      .single()
    if (tema) temaConfig = tema.config || {}
  }

  const corPrimaria = temaConfig.cor_primaria || '#f97316'
  const corSecundaria = temaConfig.cor_secundaria || '#ffffff'
  const corFundo = temaConfig.cor_fundo || '#f9fafb'

  // 3. Buscar menu ativo
  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimento.id)
    .eq('ativo', true)
    .single()

  let categorias: any[] = []
  let itensPorCategoria: Record<string, any[]> = {}

  if (menu) {
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .eq('menu_id', menu.id)
      .order('ordem', { ascending: true })

    if (cats && cats.length > 0) {
      categorias = cats
      const ids = cats.map((c) => c.id)
      const { data: itens } = await supabase
        .from('itens_cardapio')
        .select('*')
        .in('categoria_id', ids)
        .eq('disponivel', true)
        .order('ordem', { ascending: true })

      if (itens) {
        cats.forEach((cat) => {
          itensPorCategoria[cat.id] = itens.filter(
            (item) => item.categoria_id === cat.id
          )
        })
      }
    }
  }

  const nomeExibicao = estabelecimento.nome_fantasia || estabelecimento.nome
  const logoUrl = estabelecimento.logo_url
  const totalItens = Object.values(itensPorCategoria).reduce(
    (acc, items) => acc + items.length,
    0
  )

  const formatarPreco = (valor: number) =>
    valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen" style={{ backgroundColor: corFundo }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Cabeçalho com logo */}
        <div
          className="rounded-2xl shadow-lg p-6 mb-8"
          style={{ backgroundColor: corSecundaria, border: `1px solid ${corPrimaria}40` }}
        >
          <div className="flex items-center gap-4">
            {logoUrl && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: corPrimaria }}>
                <Image
                  src={logoUrl}
                  alt={`Logo de ${nomeExibicao}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={true}
                  priority // carrega imediatamente (LCP)
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: corPrimaria }}>
                {nomeExibicao}
              </h1>
              <p className="text-sm text-gray-500">
                {estabelecimento.bairro} • {estabelecimento.tipo_cozinha || 'Cozinha variada'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {totalItens} itens • {categorias.length} categorias
              </p>
            </div>
          </div>
          <Link
            href={`/${estabelecimento.cidade}/${estabelecimento.bairro}/${estabelecimento.tipo_estabelecimento}/${estabelecimento.slug}`}
            className="text-sm hover:underline mt-2 inline-block"
            style={{ color: corPrimaria }}
          >
            ← Voltar ao perfil
          </Link>
        </div>

        {/* Cardápio */}
        {categorias.length === 0 ? (
          <div
            className="rounded-2xl shadow p-12 text-center text-gray-500"
            style={{ backgroundColor: corSecundaria }}
          >
            <p className="text-lg font-medium">Nenhum item disponível no cardápio</p>
            <p className="text-sm">Volte em breve para novidades!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categorias.map((cat) => {
              const itens = itensPorCategoria[cat.id] || []
              if (itens.length === 0) return null

              return (
                <div
                  key={cat.id}
                  className="rounded-2xl shadow-lg overflow-hidden"
                  style={{ backgroundColor: corSecundaria }}
                >
                  {/* Cabeçalho da categoria */}
                  <div
                    className="px-6 py-3 border-b"
                    style={{
                      backgroundColor: `${corPrimaria}15`,
                      borderColor: `${corPrimaria}30`,
                    }}
                  >
                    <h2 className="text-lg font-semibold" style={{ color: corPrimaria }}>
                      {cat.nome}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({itens.length})
                      </span>
                    </h2>
                  </div>

                  {/* Itens da categoria */}
                  <div className="divide-y divide-gray-100">
                    {itens.map((item) => {
                      const fotoOtimizada = getOptimizedCloudinaryUrl(item.foto_url, 150, 150, 'fill')

                      return (
                        <div key={item.id} className="p-4 hover:bg-gray-50 transition group">
                          <div className="flex gap-4">
                            {fotoOtimizada && (
                              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                  src={fotoOtimizada}
                                  alt={item.nome}
                                  fill
                                  className="object-cover group-hover:scale-105 transition duration-300"
                                  sizes="96px"
                                  unoptimized={true}
                                  loading="lazy" // lazy loading nativo
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.codigo && (
                                      <span className="text-xs font-mono bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                                        {item.codigo}
                                      </span>
                                    )}
                                    <h3 className="font-medium text-gray-800">{item.nome}</h3>
                                    {item.promocao_ativa && (
                                      <span
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: `${corPrimaria}20`,
                                          color: corPrimaria,
                                        }}
                                      >
                                        🔥 Promoção
                                      </span>
                                    )}
                                    {item.delivery_disponivel && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        🛵 Delivery
                                      </span>
                                    )}
                                  </div>
                                  {item.descricao && (
                                    <p className="text-sm text-gray-500 mt-1">{item.descricao}</p>
                                  )}
                                </div>
                                <div className="text-right whitespace-nowrap">
                                  {item.promocao_ativa && item.preco_promocional ? (
                                    <div>
                                      <span className="text-xs text-gray-400 line-through">
                                        R$ {formatarPreco(item.preco)}
                                      </span>
                                      <span
                                        className="font-bold text-lg ml-2"
                                        style={{ color: corPrimaria }}
                                      >
                                        R$ {formatarPreco(item.preco_promocional)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span
                                      className="font-bold text-lg"
                                      style={{ color: corPrimaria }}
                                    >
                                      R$ {formatarPreco(item.preco)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {(item.tags?.length > 0 || item.alergenos?.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.tags?.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {item.alergenos?.map((alergeno: string) => (
                                    <span
                                      key={alergeno}
                                      className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full"
                                    >
                                      ⚠️ {alergeno}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}