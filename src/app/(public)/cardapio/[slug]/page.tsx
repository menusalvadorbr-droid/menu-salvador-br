import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/logError'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Metadata } from 'next'
import CarrinhoProvider from '@/modules/pedidos/customer/CarrinhoProvider'
import { TraducaoProvider, Texto, TextoInterface, SeletorIdioma, type TraducaoRow, type TraducaoInterfaceRow } from '@/components/public/TraducaoCardapio'
import SpecialOfferCard from '@/components/public/SpecialOfferCard'
import { calcularEstadoOferta, type EstadoOferta, type SpecialOfferRow } from '@/lib/specialOffers'
import NavegacaoCategorias from '@/components/public/NavegacaoCategorias'
import FaixasCategorias from '@/components/public/FaixasCategorias'
import ItemCatalogoCard from '@/components/public/ItemCatalogoCard'
import ItemListaLinha from '@/components/public/ItemListaLinha'
import { obterFonteTema } from '@/lib/fontesTema'
import { gradienteHeroImagem } from '@/lib/temaHero'
import { SELECT_ITEM_CARDAPIO_PUBLICO } from '@/lib/resolverItemCardapio'

// Fora do componente (Server Component roda uma vez por request, mas o
// lint de pureza não sabe disso e trata new Date()/Date.now() escritos
// direto no corpo do componente como impuro) — mesmo motivo de
// calcularEstadoOferta já viver em módulo separado.
function algumaOfertaEncerrandoEmBreve(ofertas: { estado: EstadoOferta }[]): boolean {
  return ofertas.some(
    ({ estado }) => estado.tipo === 'ativo' && (new Date(estado.fimIso).getTime() - Date.now()) / 60000 <= 30
  )
}

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
  const fonteTema = obterFonteTema(temaConfig.fonte)
  const heroComImagem = temaConfig.hero_modo === 'imagem' && !!temaConfig.hero_imagem_url
  const heroGradiente = gradienteHeroImagem(corF, Number(temaConfig.hero_veu_opacidade) || 50)
  const cardRaio = `${Number.isFinite(temaConfig.card_raio) ? temaConfig.card_raio : 16}px`

  // 3. Config do cardápio — salvo em estabelecimentos.cardapio_config (pelo TemaEditor)
  const cc: any = est.cardapio_config || {}
  const fotoPosicao      = (cc.foto_posicao      ?? 'left') as 'left' | 'right' | 'top' | 'none'
  const mostrarCodigo    = cc.mostrar_codigo    !== false
  const mostrarAlergenos = cc.mostrar_alergenos !== false
  const tituloCardapio   = cc.titulo            || est.nome_fantasia || est.nome

  // Navegação de categoria — independente do Formato (Lista/Catálogo).
  // "Faixas" muda só o container de navegação: cada categoria vira uma
  // faixa que busca seus itens sob demanda ao abrir, em vez de tudo já
  // carregado de uma vez como na navegação em pílulas (padrão).
  const navegacaoCategoria: 'pilulas' | 'faixas' =
    est.cardapio_navegacao_categoria === 'faixas' ? 'faixas' : 'pilulas'

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
  let totalItensFaixas = 0

  if (menu) {
    const { data: cats } = await supabase
      .from('categorias').select('*').eq('menu_id', menu.id).order('ordem')
    categorias = cats || []

    if (categorias.length > 0) {
      const catIds = categorias.map((c: any) => c.id)

      if (navegacaoCategoria === 'faixas') {
        // Faixas expansíveis: os itens de cada categoria só são buscados
        // quando o visitante abre aquela faixa (FaixasCategorias.tsx,
        // client-side) — aqui busca só a contagem (pro cabeçalho) e os
        // itens em promoção (pro carrossel do topo), sem trazer o
        // cardápio inteiro de uma vez como a navegação em pílulas faz.
        const [{ count }, { data: promoItens }] = await Promise.all([
          supabase
            .from('itens_cardapio')
            .select('*', { count: 'exact', head: true })
            .in('categoria_id', catIds)
            .eq('disponivel', true),
          supabase
            .from('itens_cardapio')
            .select('id, nome, preco, preco_promocional, foto_url, categoria_id')
            .in('categoria_id', catIds)
            .eq('disponivel', true)
            .eq('promo_status', 'active')
            .not('preco_promocional', 'is', null),
        ])
        totalItensFaixas = count || 0
        itensComPromo = promoItens || []
      } else {
        const { data: itens, error: itensErr } = await supabase
          .from('itens_cardapio')
          .select(SELECT_ITEM_CARDAPIO_PUBLICO)
          .in('categoria_id', catIds)
          .eq('disponivel', true)
          .order('ordem')

        if (itensErr) logSupabaseError('Erro ao buscar itens do cardápio público:', itensErr)

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
  }

  const totalItens = navegacaoCategoria === 'faixas'
    ? totalItensFaixas
    : Object.values(itensPorCat).reduce((a, b) => a + b.length, 0)
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Formato do cardápio — campo independente do tema (estabelecimentos.
  // cardapio_formato), escolhido em Configurações → Tema. Desacoplado de
  // temas.config: um estabelecimento pode trocar de tema sem perder o
  // formato escolhido, e vice-versa.
  const layoutCardapio: 'lista' | 'catalogo' = est.cardapio_formato === 'catalogo' ? 'catalogo' : 'lista'

  // "Clique expande" — opt-in via Configurações → Recursos do cardápio,
  // independente de tema (funciona tanto na Lista quanto no Catálogo).
  const cliqueExpandeAtivado = !!est.cardapio_clique_expande_ativado

  // Carrinho de pedidos — opt-in via Configurações → Recursos do cardápio.
  // Desligado (padrão), nenhum botão de "Adicionar" aparece em lugar
  // nenhum (nem no card comum, nem no painel de clique expande) — o
  // cardápio fica só informativo.
  const carrinhoAtivado = !!est.cardapio_carrinho_ativado

  // Tradução manual do cardápio (EN/FR/ES) — só busca se algum idioma
  // estiver ativado em Configurações → Idiomas.
  const idiomasAtivos: string[] = est.idiomas_ativos || []
  let traducoes: TraducaoRow[] = []
  let traducoesInterface: TraducaoInterfaceRow[] = []
  if (idiomasAtivos.length > 0) {
    const [{ data: trads }, { data: tradsInterface }] = await Promise.all([
      supabase
        .from('traducoes')
        .select('tipo_registro, registro_id, idioma, campo, valor')
        .eq('estabelecimento_id', est.id),
      // Textos fixos da interface (rótulos, botões, dias da semana) —
      // globais da plataforma, não filtrados por estabelecimento; cadastrados
      // uma vez pelo admin geral em /admin/traducoes-interface.
      supabase.from('traducoes_interface').select('chave, idioma, valor'),
    ])
    traducoes = trads || []
    traducoesInterface = tradsInterface || []
  }

  // Promoções com contador (special_offers) — combos/ofertas por tempo
  // limitado que não são itens do cardápio, feature independente das
  // promoções de item, opt-in via Configurações → Recursos do cardápio.
  const ofertasVisiveis: { offer: SpecialOfferRow; estado: EstadoOferta }[] = []
  if (est.promocoes_contador_ativado) {
    const { data: ofertasData } = await supabase
      .from('special_offers')
      .select('*')
      .eq('estabelecimento_id', est.id)
      .eq('ativo', true)
    for (const offer of (ofertasData as SpecialOfferRow[]) || []) {
      const estado = calcularEstadoOferta(offer)
      if (estado.tipo !== 'fora') ofertasVisiveis.push({ offer, estado })
    }
    // Mais urgentes primeiro (quem termina mais cedo primeiro — pra uma
    // oferta "ativo" isso já É a urgência), ofertas só anunciadas (sem
    // horário ativo agora, logo sem "termina em" de verdade) por último.
    ofertasVisiveis.sort((a, b) => {
      const fimA = a.estado.tipo === 'ativo' ? new Date(a.estado.fimIso).getTime() : Infinity
      const fimB = b.estado.tipo === 'ativo' ? new Date(b.estado.fimIso).getTime() : Infinity
      return fimA - fimB
    })
  }

  // Selo de alerta no cabeçalho da seção — acende se qualquer oferta ativa
  // (special_offers) estiver a ≤30min do fim.
  const mostrarAlertaEncerrando = algumaOfertaEncerrandoEmBreve(ofertasVisiveis)

  return (
    // TraducaoProvider por fora — CarrinhoProvider renderiza sua própria UI
    // (sacola flutuante, drawer, modal de finalizar, chamar garçom) como
    // irmã de `children`, não descendente; com TraducaoProvider por dentro
    // essa UI nunca conseguiria ler o idioma escolhido pra se traduzir.
    <TraducaoProvider slug={est.slug} idiomasAtivos={idiomasAtivos} traducoes={traducoes} traducoesInterface={traducoesInterface}>
    <CarrinhoProvider estabelecimentoId={est.id} whatsapp={est.whatsapp}>
    <div className={`min-h-screen ${fonteTema.className}`} style={{ backgroundColor: corF, color: corT }}>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-12">

        {/* ── CABEÇALHO / HERO ── */}
        <div className="overflow-hidden rounded-2xl shadow mb-4"
          style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
          {/* Bloco de identidade — só essa parte vira o "hero": fundo em cor
              sólida (padrão) ou foto + véu escuro por cima, configurados no
              tema. Com foto, a cor do texto vira branco (herdada pelos
              parágrafos abaixo, que não têm cor própria); sem foto, segue
              corP/corT normalmente. */}
          <div className="p-5"
            style={
              heroComImagem
                ? {
                    backgroundImage: `${heroGradiente}, url(${temaConfig.hero_imagem_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#ffffff',
                  }
                : undefined
            }>
            <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              {est.logo_url && (
                <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden rounded-full border-2"
                  style={{ borderColor: heroComImagem ? '#ffffff' : corP }}>
                  <Image src={est.logo_url} alt={tituloCardapio} fill
                    className="object-cover" sizes="56px" unoptimized priority />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: heroComImagem ? '#ffffff' : corP }}>{tituloCardapio}</h1>
                <p className="text-sm opacity-70">
                  {est.bairro}
                  {' · '}
                  {(est.estabelecimento_tipos_cozinha || [])
                    .map((v: any) => v.tipos_cozinha?.nome)
                    .filter(Boolean)
                    .join(', ') || <TextoInterface chave="culinaria_variada">Culinária variada</TextoInterface>}
                </p>
                <p className="text-xs opacity-50 mt-0.5">
                  {totalItens} <TextoInterface chave="itens_label">itens</TextoInterface> · {categorias.length} <TextoInterface chave="categorias_label">categorias</TextoInterface>
                </p>
                {est.endereco && (
                  <p className="mt-1 text-xs opacity-60">📍 {[est.endereco, est.numero].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
            <SeletorIdioma idiomasAtivos={idiomasAtivos} />
            </div>
          </div>
          <div className="px-5 pb-5" style={{ paddingTop: heroComImagem ? '0.75rem' : undefined }}>
          <Link
            href={
              est.cidade && est.bairros?.slug && est.tipo_estabelecimento
                ? `/${est.cidade}/${est.bairros.slug}/${est.tipo_estabelecimento}/${est.slug}`
                : `/cardapio/${est.slug}`
            }
            className="mt-3 inline-block text-sm hover:underline" style={{ color: corP }}>
            ← <TextoInterface chave="voltar_perfil">Voltar ao perfil</TextoInterface>
          </Link>
          {!est.owner_user_id && (
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: `${corP}12`, border: `1px solid ${corBd}` }}
            >
              <span style={{ color: corP }}>
                <strong><TextoInterface chave="reivindicar_titulo">Esse é o seu estabelecimento?</TextoInterface></strong>{' '}
                <TextoInterface chave="reivindicar_texto_cardapio">Reivindique pra editar o cardápio.</TextoInterface>
              </span>
              <a
                href={`/estabelecimentos/novo?cnpj=${est.cnpj}`}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: corP }}
              >
                <TextoInterface chave="reivindicar_botao">Reivindicar</TextoInterface>
              </a>
            </div>
          )}
          </div>
        </div>

        {/* ── CARROSSEL DE PROMOÇÕES ── */}
        {(itensComPromo.length > 0 || ofertasVisiveis.length > 0) && (
          <div className="rounded-2xl mb-4 overflow-hidden shadow"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
            <div className="px-4 py-3 border-b flex items-center gap-2"
              style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
              <span className="text-base">🔥</span>
              <span className="text-sm font-semibold" style={{ color: corP }}>
                <TextoInterface chave="promocoes_hoje">Promoções de hoje</TextoInterface>
              </span>
              {mostrarAlertaEncerrando && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
                  ⚠️ <TextoInterface chave="encerrando_breve">Encerrando em breve</TextoInterface>
                </span>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto px-3 py-3 scrollbar-none">
              {itensComPromo.map((item: any) => {
                const foto = getOptimizedCloudinaryUrl(item.foto_url, 200, 200, 'fill')
                const pct  = item.preco && item.preco_promocional
                  ? Math.round((1 - item.preco_promocional / item.preco) * 100) : 0
                return (
                  <a key={item.id} href={`#cat-${item.categoria_id}`}
                    // Altura fixa (não "auto") — sem isso, o align-items:stretch
                    // padrão do flex do carrossel deixa esse card tão alto
                    // quanto o vizinho mais alto da linha (o SpecialOfferCard,
                    // que tem sua própria altura fixa maior), esticando esse
                    // card de item mesmo sem precisar. Esse valor (h-44) é a
                    // referência que SpecialOfferCard também usa.
                    className="flex-shrink-0 w-32 h-44 overflow-hidden border cursor-pointer hover:shadow-md transition"
                    style={{ backgroundColor: corF, borderColor: corBd, borderRadius: cardRaio }}>
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
                      {/* Código do produto (#123) fica só na listagem completa do
                          cardápio — no carrossel, mais compacto, não aparece. */}
                      <p className="text-xs font-medium leading-tight line-clamp-2"
                        style={{ color: corT }}><Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto></p>
                      <p className="text-xs text-gray-400 line-through mt-0.5">R$ {fmt(item.preco)}</p>
                      <p className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional)}</p>
                    </div>
                  </a>
                )
              })}
              {itensComPromo.length > 0 && ofertasVisiveis.length > 0 && (
                <div className="flex-shrink-0 w-px self-stretch my-1" style={{ backgroundColor: corBd }} />
              )}
              {ofertasVisiveis.map(({ offer, estado }) => (
                <SpecialOfferCard key={offer.id} offer={offer} estado={estado} corP={corP} corT={corT} corF={corF} corBd={corBd} />
              ))}
            </div>
          </div>
        )}

        {/* ── NAVEGAÇÃO POR CATEGORIA ── */}
        {/* Só na navegação em pílulas — no modo "faixas" a lista de
            faixas abaixo já É a navegação, as duas são alternativas. */}
        {navegacaoCategoria === 'pilulas' && categorias.length > 1 && (
          <NavegacaoCategorias
            categorias={categorias.reduce((acc: { id: string; nome: string }[], cat: any) => {
              if (itensPorCat[cat.id]?.length) acc.push({ id: cat.id, nome: cat.nome })
              return acc
            }, [])}
            corP={corP}
            corF={corF}
            corBd={corBd}
          />
        )}

        {/* ── CATEGORIAS E ITENS ── */}
        {categorias.length === 0 ? (
          <div className="rounded-2xl p-12 text-center shadow"
            style={{ backgroundColor: corS }}>
            <p className="text-lg font-medium"><TextoInterface chave="nenhum_item_disponivel">Nenhum item disponível</TextoInterface></p>
            <p className="text-sm opacity-60 mt-1"><TextoInterface chave="volte_em_breve">Volte em breve!</TextoInterface></p>
          </div>
        ) : navegacaoCategoria === 'faixas' ? (
          <FaixasCategorias
            categorias={categorias}
            layoutCardapio={layoutCardapio}
            corP={corP} corT={corT} corS={corS} corBd={corBd}
            cardRaio={cardRaio}
            mostrarCodigo={mostrarCodigo}
            mostrarAlergenos={mostrarAlergenos}
            fotoPosicao={fotoPosicao}
            cliqueExpandeAtivado={cliqueExpandeAtivado}
            carrinhoAtivado={carrinhoAtivado}
          />
        ) : layoutCardapio === 'catalogo' ? (
          <div className="space-y-6">
            {categorias.map((cat: any) => {
              const itens = itensPorCat[cat.id] || []
              if (!itens.length) return null
              return (
                <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
                  <h2 className="mb-3 text-base font-semibold" style={{ color: corP }}>
                    <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
                    <span className="ml-2 text-sm font-normal opacity-60">({itens.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {itens.map((item: any) => (
                      <ItemCatalogoCard
                        key={item.id}
                        item={item}
                        corP={corP} corT={corT} corS={corS} corBd={corBd}
                        cardRaio={cardRaio}
                        mostrarAlergenos={mostrarAlergenos}
                        cliqueExpandeAtivado={cliqueExpandeAtivado}
                        carrinhoAtivado={carrinhoAtivado}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {categorias.map((cat: any) => {
              const itens = itensPorCat[cat.id] || []
              if (!itens.length) return null
              return (
                <div key={cat.id} id={`cat-${cat.id}`}
                  className="scroll-mt-32 rounded-2xl overflow-hidden shadow"
                  style={{ backgroundColor: corS }}>

                  {/* Cabeçalho da categoria */}
                  <div className="px-5 py-3 border-b"
                    style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
                    <h2 className="text-base font-semibold" style={{ color: corP }}>
                      <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
                      <span className="ml-2 text-sm font-normal opacity-60">({itens.length})</span>
                    </h2>
                  </div>

                  {/* Itens */}
                  <div className="divide-y" style={{ borderColor: corBd }}>
                    {itens.map((item: any) => (
                      <ItemListaLinha
                        key={item.id}
                        item={item}
                        corP={corP} corT={corT} corS={corS} corBd={corBd}
                        mostrarCodigo={mostrarCodigo}
                        mostrarAlergenos={mostrarAlergenos}
                        fotoPosicao={fotoPosicao}
                        cliqueExpandeAtivado={cliqueExpandeAtivado}
                        carrinhoAtivado={carrinhoAtivado}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RODAPÉ */}
        <p className="mt-8 text-center text-xs opacity-40" style={{ color: corT }}>
          <TextoInterface chave="rodape_aviso">
            Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.
          </TextoInterface>
        </p>
      </div>
    </div>
    </CarrinhoProvider>
    </TraducaoProvider>
  )
}
