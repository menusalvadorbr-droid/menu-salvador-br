import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Metadata } from 'next'
import ContadorRegressivo from './ContadorRegressivo'

// ─────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('nome, nome_fantasia, descricao, bairro, foto_capa')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()

  if (!est) return { title: 'Cardápio Digital' }
  const nome = est.nome_fantasia || est.nome
  const desc = est.descricao || `Cardápio digital de ${nome} em ${est.bairro}.`
  const img  = est.foto_capa || '/default-og-image.jpg'
  return {
    title: `${nome} — Cardápio Digital`,
    description: desc,
    openGraph: { title: `${nome} — Cardápio`, description: desc, images: [{ url: img, width: 1200, height: 630 }] },
    robots: { index: true, follow: true },
  }
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default async function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { slug } = await params

  // 1. Estabelecimento
  const { data: est, error: estErr } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (estErr || !est) notFound()

  // 2. Tema (cores)
  let temaConfig: any = {}
  if (est.tema_atual_id) {
    const { data: tema } = await supabase
      .from('temas').select('config').eq('id', est.tema_atual_id).single()
    if (tema) temaConfig = tema.config || {}
  }
  const corP  = temaConfig.cor_primaria   || '#f97316'
  const corS  = temaConfig.cor_secundaria || '#ffffff'
  const corF  = temaConfig.cor_fundo      || '#f9fafb'
  const corT  = temaConfig.cor_texto      || '#1f2937'
  const corBd = temaConfig.cor_borda      || `${corP}30`

  // 3. Config do cardápio — salvo em estabelecimentos.cardapio_config (pelo TemaEditor)
  const cc: any = est.cardapio_config || {}
  const fotoPosicao      = (cc.foto_posicao      ?? 'left') as 'left' | 'right' | 'top' | 'none'
  const mostrarCodigo    = cc.mostrar_codigo    !== false
  const mostrarAlergenos = cc.mostrar_alergenos !== false
  const tituloCardapio   = cc.titulo            || est.nome_fantasia || est.nome

  // 4. Menu → categorias → itens + alérgenos
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', est.id)
    .order('created_at', { ascending: true })
    .limit(1)
  const menu = menus?.[0] ?? null

  let categorias: any[]                      = []
  let itensPorCat: Record<string, any[]>     = {}
  let itensComPromo: any[]                   = []

  if (menu) {
    const { data: cats } = await supabase
      .from('categorias').select('*').eq('menu_id', menu.id).order('ordem')
    categorias = cats || []

    if (categorias.length > 0) {
      const catIds = categorias.map((c: any) => c.id)
      const { data: itens } = await supabase
        .from('itens_cardapio')
        .select(`*, item_allergens(allergen:allergen_id(id, nome, icone))`)
        .in('categoria_id', catIds)
        .eq('disponivel', true)
        .order('ordem')

      if (itens) {
        categorias.forEach((cat: any) => {
          itensPorCat[cat.id] = itens.filter((i: any) => i.categoria_id === cat.id)
        })
        // Itens com promoção ativa para o carrossel do topo
        itensComPromo = itens.filter((i: any) =>
          i.promo_status === 'active' && i.preco_promocional && i.disponivel
        )
      }
    }
  }

  // 5. Promoções avulsas (special_offers) — busca e filtra vigência no servidor
  const now = new Date()
  const diaSemana = now.getDay() // 0=dom ... 6=sab
  const horaAtual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

  const { data: rawOffers } = await supabase
    .from('special_offers')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .eq('ativo', true)

  // Filtrar offers vigentes agora (pontual ou recorrente)
  const specialOffers: any[] = (rawOffers || []).filter((o: any) => {
    if (o.recorrente) {
      const dias: number[] = o.dias_semana || []
      if (!dias.includes(diaSemana)) return false
      const hi = o.hora_inicio || '00:00'
      const hf = o.hora_fim    || '23:59'
      return horaAtual >= hi && horaAtual <= hf
    }
    // pontual
    if (o.inicio_em && new Date(o.inicio_em) > now) return false
    if (o.fim_em    && new Date(o.fim_em)    < now) return false
    return true
  })

  // Calcular urgência de cada offer (minutos até encerrar)
  const minutosAteEncerrar = (o: any): number | null => {
    if (o.recorrente && o.hora_fim) {
      const [hh, mm] = o.hora_fim.split(':').map(Number)
      const fim = new Date(now)
      fim.setHours(hh, mm, 0, 0)
      return Math.floor((fim.getTime() - now.getTime()) / 60000)
    }
    if (o.fim_em) return Math.floor((new Date(o.fim_em).getTime() - now.getTime()) / 60000)
    return null
  }

  // Enriquecer offers com minutos restantes
  const offersEnriquecidas = specialOffers.map(o => ({
    ...o,
    minutosRestantes: minutosAteEncerrar(o),
  }))

  // Ordenar: críticos (<10min) → urgentes (<alerta_minutos) → com tempo → sem data
  offersEnriquecidas.sort((a, b) => {
    const ma = a.minutosRestantes
    const mb = b.minutosRestantes
    if (ma === null && mb === null) return 0
    if (ma === null) return 1
    if (mb === null) return -1
    return ma - mb
  })

  // Ordenar itens do cardápio por maior desconto primeiro
  const itensOrdenados = [...itensComPromo].sort((a, b) => {
    const pa = a.preco_desconto_pct || Math.round((1 - a.preco_promocional / a.preco) * 100)
    const pb = b.preco_desconto_pct || Math.round((1 - b.preco_promocional / b.preco) * 100)
    return pb - pa
  })

  const totalItens = Object.values(itensPorCat).reduce((a, b) => a + b.length, 0)
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const alergenos = (item: any): any[] =>
    (item.item_allergens || []).map((r: any) => r.allergen).filter(Boolean)

  // Helper: classes e tamanhos da foto conforme posição
  function fotoLayout(pos: string) {
    if (pos === 'right') return { flex: 'flex-row-reverse', sz: 'w-24 h-24', sizes: '96px' }
    if (pos === 'top')   return { flex: 'flex-col',         sz: 'w-full h-44', sizes: '400px' }
    if (pos === 'none')  return { flex: 'flex-row',         sz: '',            sizes: '' }
    return                       { flex: 'flex-row',         sz: 'w-24 h-24', sizes: '96px' }
  }
  const fl = fotoLayout(fotoPosicao)

  return (
    <div className="min-h-screen" style={{ backgroundColor: corF, color: corT }}>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-12">

        {/* ── CABEÇALHO ── */}
        <div className="rounded-2xl p-5 shadow mb-4"
          style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
          <div className="flex items-center gap-4">
            {est.logo_url && (
              <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden rounded-full border-2"
                style={{ borderColor: corP }}>
                <Image src={est.logo_url} alt={tituloCardapio} fill
                  className="object-cover" sizes="56px" unoptimized priority />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: corP }}>{tituloCardapio}</h1>
              <p className="text-sm opacity-70">{est.bairro} · {est.tipo_cozinha || 'Cozinha variada'}</p>
              <p className="text-xs opacity-50 mt-0.5">{totalItens} itens · {categorias.length} categorias</p>
            </div>
          </div>
          <Link href={`/${est.cidade}/${est.bairro}/${est.tipo_estabelecimento}/${est.slug}`}
            className="mt-3 inline-block text-sm hover:underline" style={{ color: corP }}>
            ← Voltar ao perfil
          </Link>
        </div>

        {/* ── CARROSSEL DE PROMOÇÕES ── */}
        {(itensOrdenados.length > 0 || offersEnriquecidas.length > 0) && (
          <div className="rounded-2xl mb-4 overflow-hidden shadow"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
              <div className="flex items-center gap-2">
                <span className="text-base">🔥</span>
                <span className="text-sm font-semibold" style={{ color: corP }}>Promoções de hoje</span>
              </div>
              {/* aviso de encerramento próximo no header */}
              {offersEnriquecidas.some(o => o.minutosRestantes !== null && o.minutosRestantes <= 30) && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                  ⚠️ Encerrando em breve
                </span>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto px-3 py-3 scrollbar-none">

              {/* ── CARDS LARGOS: promoções avulsas (ordenadas por urgência) ── */}
              {offersEnriquecidas.map((o: any) => {
                const foto = getOptimizedCloudinaryUrl(o.foto_url, 300, 200, 'fill')
                const pct  = o.preco_de && o.preco_por && o.preco_de > o.preco_por
                  ? Math.round((1 - o.preco_por / o.preco_de) * 100) : 0
                const mins = o.minutosRestantes as number | null
                const critico = mins !== null && mins <= 10
                const urgente = mins !== null && mins <= o.alerta_minutos && mins > 10
                const temFim  = o.fim_em || (o.recorrente && o.hora_fim)
                const fimIso  = o.fim_em ? o.fim_em
                  : o.hora_fim ? (() => {
                      const [hh, mm] = (o.hora_fim as string).split(':').map(Number)
                      const d = new Date(); d.setHours(hh, mm, 0, 0)
                      return d.toISOString()
                    })() : null

                return (
                  <div key={`offer-${o.id}`}
                    className={`flex-shrink-0 w-48 rounded-xl overflow-hidden transition-all duration-300 ${
                      critico ? 'shadow-lg shadow-red-200'
                      : urgente ? 'shadow-md shadow-amber-100'
                      : 'shadow-sm hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: corF,
                      border: critico
                        ? '2px solid #ef4444'
                        : urgente
                          ? '2px solid #f59e0b'
                          : `1px solid ${corBd}`,
                    }}>

                    {/* foto */}
                    <div className="relative h-28 bg-gray-100 overflow-hidden">
                      {foto
                        ? <Image src={foto} alt={o.nome} fill
                            className="object-cover" sizes="192px" unoptimized loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">🏷️</div>
                      }

                      {/* overlay de urgência sobre a foto */}
                      {(critico || urgente) && (
                        <div className={`absolute inset-0 ${critico ? 'bg-red-900/20' : 'bg-amber-900/10'}`} />
                      )}

                      {/* badge de desconto */}
                      {pct > 0 && (
                        <span className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow"
                          style={{ backgroundColor: corP }}>
                          -{pct}%
                        </span>
                      )}

                      {/* badge tipo especial */}
                      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium shadow ${
                        critico ? 'bg-red-500 text-white animate-bounce'
                        : urgente ? 'bg-amber-500 text-white'
                        : 'bg-white/80 text-gray-700'
                      }`}>
                        {critico ? '🚨' : urgente ? '⚡' : '✨'}
                      </span>

                      {/* faixa de encerramento na base da foto */}
                      {(critico || urgente) && (
                        <div className={`absolute bottom-0 inset-x-0 py-1 px-2 text-center text-xs font-bold text-white ${
                          critico ? 'bg-red-500' : 'bg-amber-500'
                        }`}>
                          {critico ? '🚨 Últimos minutos!' : '⚡ Encerrando em breve'}
                        </div>
                      )}
                    </div>

                    {/* conteúdo */}
                    <div className="p-3">
                      <p className="text-sm font-bold leading-tight line-clamp-2 mb-1"
                        style={{ color: corT }}>{o.nome}</p>
                      {o.descricao && (
                        <p className="text-xs line-clamp-1 mb-2 opacity-60"
                          style={{ color: corT }}>{o.descricao}</p>
                      )}
                      <div className="flex items-end justify-between gap-1">
                        <div>
                          {o.preco_de && (
                            <p className="text-xs text-gray-400 line-through leading-none">
                              R$ {fmt(o.preco_de)}
                            </p>
                          )}
                          <p className="text-base font-bold leading-none" style={{ color: corP }}>
                            R$ {fmt(o.preco_por)}
                          </p>
                        </div>
                        {/* contador regressivo client-side */}
                        {fimIso && (
                          <ContadorRegressivo
                            fimIso={fimIso}
                            alertaMinutos={o.alerta_minutos || 30}
                            corP={corP}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* separador visual se houver os dois tipos */}
              {offersEnriquecidas.length > 0 && itensOrdenados.length > 0 && (
                <div className="flex-shrink-0 w-px self-stretch my-2"
                  style={{ backgroundColor: corBd }} />
              )}

              {/* ── CARDS COMPACTOS: itens do cardápio em promoção ── */}
              {itensOrdenados.map((item: any) => {
                const foto = getOptimizedCloudinaryUrl(item.foto_url, 200, 200, 'fill')
                const pct  = item.preco && item.preco_promocional
                  ? Math.round((1 - item.preco_promocional / item.preco) * 100) : 0
                return (
                  <a key={`item-${item.id}`} href={`#cat-${item.categoria_id}`}
                    className="flex-shrink-0 w-32 rounded-xl overflow-hidden border cursor-pointer hover:shadow-md transition"
                    style={{ backgroundColor: corF, borderColor: corBd }}>
                    <div className="relative h-20 bg-gray-100">
                      {foto
                        ? <Image src={foto} alt={item.nome} fill
                            className="object-cover" sizes="128px" unoptimized loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                      }
                      {pct > 0 && (
                        <span className="absolute top-1 left-1 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: corP }}>-{pct}%</span>
                      )}
                    </div>
                    <div className="p-2">
                      {mostrarCodigo && item.codigo && (
                        <span className="text-xs font-mono opacity-60 block">#{item.codigo}</span>
                      )}
                      <p className="text-xs font-medium leading-tight line-clamp-2"
                        style={{ color: corT }}>{item.nome}</p>
                      <p className="text-xs text-gray-400 line-through mt-0.5">R$ {fmt(item.preco)}</p>
                      <p className="text-xs font-bold" style={{ color: corP }}>
                        R$ {fmt(item.preco_promocional)}
                      </p>
                    </div>
                  </a>
                )
              })}

            </div>
          </div>
        )}

        {/* ── NAVEGAÇÃO POR CATEGORIA ── */}
        {categorias.length > 1 && (
          <div className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-4 flex gap-2 overflow-x-auto scrollbar-none backdrop-blur-md border-b"
            style={{ backgroundColor: `${corF}ee`, borderColor: corBd }}>
            {categorias.map((cat: any) => {
              if (!(itensPorCat[cat.id]?.length)) return null
              return (
                <a key={cat.id} href={`#cat-${cat.id}`}
                  className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition"
                  style={{ backgroundColor: `${corP}15`, color: corP }}>
                  {cat.nome}
                </a>
              )
            })}
          </div>
        )}

        {/* ── CATEGORIAS E ITENS ── */}
        {categorias.length === 0 ? (
          <div className="rounded-2xl p-12 text-center shadow"
            style={{ backgroundColor: corS }}>
            <p className="text-lg font-medium">Nenhum item disponível</p>
            <p className="text-sm opacity-60 mt-1">Volte em breve!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categorias.map((cat: any) => {
              const itens = itensPorCat[cat.id] || []
              if (!itens.length) return null
              return (
                <div key={cat.id} id={`cat-${cat.id}`}
                  className="scroll-mt-20 rounded-2xl overflow-hidden shadow"
                  style={{ backgroundColor: corS }}>

                  {/* Cabeçalho da categoria */}
                  <div className="px-5 py-3 border-b"
                    style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
                    <h2 className="text-base font-semibold" style={{ color: corP }}>
                      {cat.nome}
                      <span className="ml-2 text-sm font-normal opacity-60">({itens.length})</span>
                    </h2>
                  </div>

                  {/* Itens */}
                  <div className="divide-y" style={{ borderColor: corBd }}>
                    {itens.map((item: any) => {
                      const foto     = getOptimizedCloudinaryUrl(item.foto_url, 300, 300, 'fill')
                      const algArr   = alergenos(item)
                      const promoOk  = item.promo_status === 'active' && item.preco_promocional

                      return (
                        <div key={item.id} className="p-4 group hover:bg-black/[.02] transition">
                          <div className={`flex ${fl.flex} gap-4 items-start`}>

                            {/* FOTO */}
                            {fotoPosicao !== 'none' && foto && (
                              <div className={`${fl.sz} relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-100`}>
                                <Image src={foto} alt={item.nome} fill
                                  className="object-cover group-hover:scale-105 transition duration-300"
                                  sizes={fl.sizes} unoptimized loading="lazy" />
                              </div>
                            )}

                            {/* CONTEÚDO */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">

                                {/* Nome + badges */}
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    {mostrarCodigo && item.codigo && (
                                      <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: `${corP}18`, color: corP }}>
                                        #{item.codigo}
                                      </span>
                                    )}
                                    <h3 className="font-semibold text-sm" style={{ color: corT }}>
                                      {item.nome}
                                    </h3>
                                    {promoOk && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                        style={{ backgroundColor: corP }}>
                                        🔥 Promoção
                                      </span>
                                    )}
                                    {item.delivery_disponivel && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        🛵 Delivery
                                      </span>
                                    )}
                                  </div>
                                  {item.descricao && (
                                    <p className="text-xs leading-relaxed opacity-70" style={{ color: corT }}>
                                      {item.descricao}
                                    </p>
                                  )}
                                  {/* ALÉRGENOS */}
                                  {mostrarAlergenos && algArr.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {algArr.map((a: any) => (
                                        <span key={a.id}
                                          className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
                                          style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                                          title={`Alérgeno: ${a.nome}`}>
                                          {a.icone && <span>{a.icone}</span>}
                                          {a.nome}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* PREÇO */}
                                <div className="text-right flex-shrink-0">
                                  {promoOk ? (
                                    <>
                                      <div className="text-xs text-gray-400 line-through">
                                        R$ {fmt(item.preco)}
                                      </div>
                                      <div className="text-base font-bold" style={{ color: corP }}>
                                        R$ {fmt(item.preco_promocional)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-base font-bold" style={{ color: corP }}>
                                      R$ {fmt(item.preco)}
                                    </div>
                                  )}
                                </div>
                              </div>
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

        {/* RODAPÉ */}
        <p className="mt-8 text-center text-xs opacity-40" style={{ color: corT }}>
          Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.
        </p>
      </div>
    </div>
  )
}
