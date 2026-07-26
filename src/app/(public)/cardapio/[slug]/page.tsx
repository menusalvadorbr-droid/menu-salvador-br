import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Metadata } from 'next'
import CarrinhoProvider from '@/modules/pedidos/customer/CarrinhoProvider'
import BotaoAdicionarCarrinho from '@/modules/pedidos/customer/BotaoAdicionarCarrinho'

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
    .select('*, bairros(nome, slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome))')
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
        .select(`*, item_allergens(allergen:allergen_id(id, nome, icone)), variacoes_item(id, nome, preco), item_grupo_complemento(ordem, grupos_complementos(id, nome, selecao_minima, selecao_maxima, opcoes_complemento(id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome))))`)
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
    <CarrinhoProvider estabelecimentoId={est.id} whatsapp={est.whatsapp}>
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
              <p className="text-sm opacity-70">
                {est.bairro}
                {' · '}
                {(est.estabelecimento_tipos_cozinha || [])
                  .map((v: any) => v.tipos_cozinha?.nome)
                  .filter(Boolean)
                  .join(', ') || 'Culinária variada'}
              </p>
              <p className="text-xs opacity-50 mt-0.5">{totalItens} itens · {categorias.length} categorias</p>
              {est.endereco && (
                <p className="mt-1 text-xs opacity-60">📍 {est.endereco}</p>
              )}
            </div>
          </div>
          <Link
            href={
              est.cidade && est.bairros?.slug && est.tipo_estabelecimento
                ? `/${est.cidade}/${est.bairros.slug}/${est.tipo_estabelecimento}/${est.slug}`
                : `/cardapio/${est.slug}`
            }
            className="mt-3 inline-block text-sm hover:underline" style={{ color: corP }}>
            ← Voltar ao perfil
          </Link>
          {!est.owner_user_id && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: `${corP}12`, border: `1px solid ${corBd}` }}
            >
              <span style={{ color: corP }}>
                <strong>Esse é o seu estabelecimento?</strong> Reivindique pra editar o cardápio.
              </span>
              <a
                href={`/estabelecimentos/novo?cnpj=${est.cnpj}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: corP }}
              >
                Reivindicar
              </a>
            </div>
          )}
        </div>

        {/* ── CARROSSEL DE PROMOÇÕES ── */}
        {itensComPromo.length > 0 && (
          <div className="rounded-2xl mb-4 overflow-hidden shadow"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
            <div className="px-4 py-3 border-b flex items-center gap-2"
              style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
              <span className="text-base">🔥</span>
              <span className="text-sm font-semibold" style={{ color: corP }}>Promoções de hoje</span>
            </div>
            <div className="flex gap-3 overflow-x-auto px-3 py-3 scrollbar-none">
              {itensComPromo.map((item: any) => {
                const foto = getOptimizedCloudinaryUrl(item.foto_url, 200, 200, 'fill')
                const pct  = item.preco && item.preco_promocional
                  ? Math.round((1 - item.preco_promocional / item.preco) * 100) : 0
                return (
                  <a key={item.id} href={`#cat-${item.categoria_id}`}
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
                      <p className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional)}</p>
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
                                  {/* GRUPOS DE COMPLEMENTOS — só informativo por enquanto; o
                                      carrinho ainda não suporta escolher complementos, então
                                      não tem seleção interativa aqui, só a lista do que existe.
                                      Fica em caixa própria (borda + fundo levemente colorido),
                                      separada visualmente da descrição do prato. */}
                                  {item.item_grupo_complemento && item.item_grupo_complemento.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      {[...item.item_grupo_complemento]
                                        .sort((a: any, b: any) => a.ordem - b.ordem)
                                        .filter((v: any) => v.grupos_complementos)
                                        .map((v: any) => {
                                          const g = v.grupos_complementos
                                          const rotuloSelecao = g.selecao_minima > 0
                                            ? (g.selecao_minima === g.selecao_maxima
                                                ? `escolha ${g.selecao_minima} · obrigatório`
                                                : `escolha ${g.selecao_minima} a ${g.selecao_maxima} · obrigatório`)
                                            : `opcional · até ${g.selecao_maxima}`
                                          return (
                                            <div key={g.id} className="rounded-lg px-2.5 py-1.5"
                                              style={{ backgroundColor: `${corP}0d`, border: `1px solid ${corBd}` }}>
                                              <p className="text-[11px] font-semibold" style={{ color: corT }}>
                                                {g.nome}
                                                <span className="font-normal opacity-60"> — {rotuloSelecao}</span>
                                              </p>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {(g.opcoes_complemento || [])
                                                  .sort((a: any, b: any) => a.ordem - b.ordem)
                                                  .map((o: any) => {
                                                    const nomeOpcao = o.itens_cardapio?.nome || '(item removido)'
                                                    // exibir_preco = false força esconder o valor mesmo que
                                                    // preco_adicional seja > 0 — decisão do dono por opção.
                                                    const label = o.exibir_preco === false || !(o.preco_adicional > 0)
                                                      ? nomeOpcao
                                                      : `${nomeOpcao} (+R$ ${fmt(o.preco_adicional)})`
                                                    return (
                                                      <span key={o.id} className="text-[11px] px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: corS, border: `1px solid ${corBd}`, color: corT }}>
                                                        {label}
                                                      </span>
                                                    )
                                                  })}
                                              </div>
                                            </div>
                                          )
                                        })}
                                    </div>
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
                                  {item.variacoes_item && item.variacoes_item.length > 0 ? (
                                    // Item com tamanhos/variações — mostra a lista de opções.
                                    // O carrinho ainda não sabe pedir "qual tamanho", então por
                                    // enquanto não mostramos o botão de adicionar aqui — fica
                                    // como próximo passo natural quando o carrinho ganhar suporte
                                    // a variações.
                                    <div className="space-y-0.5">
                                      {[...item.variacoes_item]
                                        .sort((a: any, b: any) => a.preco - b.preco)
                                        .map((v: any) => (
                                          <div key={v.id} className="flex items-baseline justify-end gap-2 text-xs">
                                            <span className="opacity-60" style={{ color: corT }}>{v.nome}</span>
                                            <span className="font-bold text-sm" style={{ color: corP }}>R$ {fmt(v.preco)}</span>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <>
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
                                      <BotaoAdicionarCarrinho
                                        id={item.id}
                                        nome={item.nome}
                                        preco={item.preco}
                                        precoPromocional={promoOk ? item.preco_promocional : null}
                                        corDestaque={corP}
                                      />
                                    </>
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
    </CarrinhoProvider>
  )
}
