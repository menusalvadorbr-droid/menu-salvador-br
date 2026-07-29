import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import GaleriaEstabelecimento from '@/components/public/GaleriaEstabelecimento'
import SectionHeading from '@/components/public/SectionHeading'
import StatusPill from '@/components/public/StatusPill'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import Hero from '@/features/home/Hero'
import { PromocoesCarrossel } from '@/features/home/PromocoesCarrossel'
import ExploradorEstabelecimentos from '@/features/home/ExploradorEstabelecimentos'
import BotaoFlutuante from '@/features/home/BotaoFlutuante'
import PropagandaCard from '@/components/public/PropagandaCard'
import SecaoAnimada from '@/components/public/SecaoAnimada'
import SecaoAvaliacoesGoogle from '@/components/public/SecaoAvaliacoesGoogle'
import { getPromocoesAtivas } from '@/features/home/getPromocoesAtivas'
import { TraducaoProvider, Texto, TextoInterface, SeletorIdioma, type TraducaoRow, type TraducaoInterfaceRow } from '@/components/public/TraducaoCardapio'
import type { Metadata } from 'next'

// ============================================================
// FUNÇÕES DE DETECÇÃO
// ============================================================

async function isTipo(cidade: string, termo: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', termo)
    .limit(1)
  return (count ?? 0) > 0
}

async function isCidade(nome: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('cidade', nome)
    .limit(1)
  return (count ?? 0) > 0
}

// ============================================================
// COMPONENTE PRINCIPAL (ÚNICA FUNÇÃO Page)
// ============================================================

// ============================================================
// SEO
// ============================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const { slug } = await params

  // Home: título e descrição próprios, pensados pra busca ("restaurantes
  // em Salvador", "cardápio digital"). Antes a home usava só o título
  // genérico do layout raiz — sem nada otimizado pra SEO.
  if (!slug || slug.length === 0) {
    return {
      title: 'menu.salvador — Cardápios digitais e restaurantes em Salvador',
      description:
        'Descubra bares, restaurantes e petiscarias em Salvador. Veja o cardápio digital, promoções do momento e peça direto pelo celular, sem baixar nenhum aplicativo.',
      openGraph: {
        title: 'menu.salvador — Cardápios digitais em Salvador',
        description: 'Descubra onde comer em Salvador e veja o cardápio sem baixar nada.',
        type: 'website',
      },
    }
  }

  // Demais rotas (cidade, bairro, tipo, estabelecimento) seguem com o
  // título genérico por enquanto — cada uma pode ganhar metadata própria
  // depois, sem afetar a home.
  return {}
}

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params

  // --- HOME ---
  if (!slug || slug.length === 0) {
    return <HomePage />
  }

  // --- 4 segmentos: estabelecimento ---
  if (slug.length === 4) {
    const [cidade, bairro, tipo, slugEst] = slug
    return <EstabelecimentoPage cidade={cidade} bairro={bairro} tipo={tipo} slug={slugEst} />
  }

  // --- 3 segmentos: tipo no bairro ---
  if (slug.length === 3) {
    const [cidade, bairro, tipo] = slug
    return <TipoNoBairroPage cidade={cidade} bairro={bairro} tipo={tipo} />
  }

  // --- 2 segmentos: cidade+tipo ou cidade+bairro ---
  if (slug.length === 2) {
    const [primeiro, segundo] = slug
    if (await isTipo(primeiro, segundo)) {
      return <TipoNaCidadePage cidade={primeiro} tipo={segundo} />
    } else {
      return <BairroPage cidade={primeiro} bairro={segundo} />
    }
  }

  // --- 1 segmento: cidade ou bairro ---
  if (slug.length === 1) {
    const [nome] = slug
    if (await isCidade(nome)) {
      return <CidadePage cidade={nome} />
    } else {
      return <BairroPage bairro={nome} />
    }
  }

  notFound()
}

// ============================================================
// PÁGINAS (Home, Cidade, Bairro, Tipo, Estabelecimento)
// ============================================================

// -------- HOME --------
async function HomePage() {
  const supabase = await createClient()

  const inicioDoDia = new Date()
  inicioDoDia.setHours(0, 0, 0, 0)

  // Todas as consultas independentes rodam em paralelo — antes eram 5
  // idas ao banco em série (cada uma esperando a anterior terminar),
  // o que deixava a home visivelmente mais lenta sem necessidade.
  const [
    { count: totalEstabs },
    { count: scansHoje },
    { data: destaques },
    { data: config },
    { data: bairros },
    { data: tiposCozinha },
    promocoes,
  ] = await Promise.all([
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('ativo', true),
    supabase.from('scans_qrcode').select('*', { count: 'exact', head: true }).gte('scanned_at', inicioDoDia.toISOString()),
    supabase
      .from('estabelecimentos')
      .select('*, bairros(nome, slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')
      .eq('status', 'active')
      .eq('ativo', true)
      .not('bairro_id', 'is', null)
      .not('tipo_estabelecimento', 'is', null)
      .order('destaque', { ascending: false })
      .limit(30),
    // Módulos da home, controlados pelo admin geral da plataforma
    // (tabela configuracoes_home — uma linha única, id=true).
    supabase.from('configuracoes_home').select('*').eq('id', true).maybeSingle(),
    supabase.from('bairros').select('id, nome, slug').order('nome'),
    // id incluído porque o filtro de culinária (ExploradorEstabelecimentos)
    // consulta a tabela de junção estabelecimento_tipos_cozinha por
    // tipo_cozinha_id — comparar pelo nome/slug não é mais suficiente.
    supabase.from('tipos_cozinha').select('id, nome, slug, icone').eq('ativo', true).order('ordem'),
    getPromocoesAtivas(),
  ])

  const heroAtivado = config?.hero_ativado ?? true
  const promocoesAtivado = config?.promocoes_ativado ?? true
  const gridAtivado = config?.grid_estabelecimentos_ativado ?? true
  const botaoFlutuanteAtivado = config?.botao_flutuante_ativado ?? true
  const filtrosAtivado = config?.filtros_ativado ?? true

  return (
    <div>
      {heroAtivado && (
        <SecaoAnimada>
          <Hero totalScans={scansHoje || 0} totalEstabs={totalEstabs || 0} />
        </SecaoAnimada>
      )}
      {promocoesAtivado && (
        <SecaoAnimada>
          <PromocoesCarrossel itens={promocoes} />
        </SecaoAnimada>
      )}
      <SecaoAnimada className="mx-auto max-w-6xl px-4 pt-6">
        <PropagandaCard />
      </SecaoAnimada>
      {gridAtivado && (
        <ExploradorEstabelecimentos
          estabelecimentosIniciais={destaques || []}
          bairros={bairros || []}
          tiposCozinha={tiposCozinha || []}
          mostrarFiltros={filtrosAtivado}
        />
      )}
      {botaoFlutuanteAtivado && <BotaoFlutuante />}
    </div>
  )
}

// -------- CIDADE --------
async function CidadePage({ cidade }: { cidade: string }) {
  const supabase = await createClient()
  const { data: tipos } = await supabase
    .from('estabelecimentos')
    .select('tipo_estabelecimento')
    .eq('cidade', cidade)
    .eq('status', 'active')
    .eq('ativo', true)

  const tiposUnicos = [...new Set(tipos?.map((t: any) => t.tipo_estabelecimento).filter(Boolean))] as string[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading title={cidade} subtitle="Explore por categoria" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiposUnicos.map((tipo) => (
          <Link
            key={tipo}
            href={`/${cidade}/${tipo}`}
            className="group rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-[var(--brand-primary)]/40"
          >
            <div className="mb-2 text-3xl">🍽️</div>
            <h2 className="text-sm font-semibold capitalize text-neutral-800 group-hover:text-[var(--brand-primary)]">
              {tipo}
            </h2>
            <p className="mt-1 text-xs text-neutral-400">Ver estabelecimentos</p>
          </Link>
        ))}
        {tiposUnicos.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhuma categoria encontrada nesta cidade.
          </p>
        )}
      </div>
    </div>
  )
}

// -------- TIPO NA CIDADE (ex: /salvador/restaurante) --------
async function TipoNaCidadePage({ cidade, tipo }: { cidade: string; tipo: string }) {
  const supabase = await createClient()
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*, bairros(nome, slug)')
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)
    .not('bairro_id', 'is', null)
    .order('destaque', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={`${tipo} em ${cidade}`}
        subtitle={`${estabelecimentos?.length || 0} estabelecimentos encontrados`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {estabelecimentos?.map((est: any) => (
          <EstablishmentCard
            key={est.id}
            estabelecimento={est}
            href={
              cidade && est.bairros?.slug && est.tipo_estabelecimento
                ? `/${cidade}/${est.bairros.slug}/${est.tipo_estabelecimento}/${est.slug}`
                : `/cardapio/${est.slug}`
            }
          />
        ))}
        {estabelecimentos?.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhum estabelecimento encontrado com esses filtros.
          </p>
        )}
      </div>
    </div>
  )
}

const ICONES_TIPO_ESTABELECIMENTO: Record<string, string> = {
  banca_acaraje: '🫘',
  bar: '🍺',
  restaurante: '🍽️',
  cafeteria: '☕',
  foodtruck: '🚚',
  lanchonete: '🥪',
}

// -------- BAIRRO (com ou sem cidade) --------
async function BairroPage({ cidade, bairro }: { cidade?: string; bairro: string }) {
  const supabase = await createClient()

  // "bairro" aqui é o slug vindo da URL — resolve pro registro real
  const { data: bairroRow } = await supabase.from('bairros').select('id, nome').eq('slug', bairro).maybeSingle()

  if (!bairroRow) notFound()

  const nomeBairro = bairroRow.nome

  let query = supabase
    .from('estabelecimentos')
    .select('*')
    .eq('bairro_id', bairroRow.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .not('tipo_estabelecimento', 'is', null)

  if (cidade) query = query.eq('cidade', cidade)

  const { data: estabelecimentos } = await query
    .order('destaque', { ascending: false })
    .order('nome', { ascending: true })

  const baseLink = cidade ? `/${cidade}/${bairro}` : `/${bairro}`

  const tiposPresentes = [
    ...new Set((estabelecimentos || []).map((e) => e.tipo_estabelecimento).filter(Boolean)),
  ] as string[]

  const total = estabelecimentos?.length || 0

  return (
    <div>
      {/* Hero do bairro */}
      <section
        className="relative overflow-hidden px-4 py-12 text-center text-white md:py-16"
        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          {cidade && (
            <Link href={`/${cidade}`} className="text-sm text-white/80 hover:underline">
              ← {cidade}
            </Link>
          )}
          <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">📍 {nomeBairro}</h1>
          <p className="mt-2 text-sm text-white/90 md:text-base">
            {total} {total === 1 ? 'estabelecimento encontrado' : 'estabelecimentos encontrados'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Chips de tipo, só se houver mais de um tipo presente */}
        {tiposPresentes.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {tiposPresentes.map((tipo) => (
              <Link
                key={tipo}
                href={`${baseLink}/${tipo}`}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
              >
                <span>{ICONES_TIPO_ESTABELECIMENTO[tipo] || '🏪'}</span>
                <span className="capitalize">{tipo.replace(/_/g, ' ')}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {estabelecimentos?.map((est) => (
            <EstablishmentCard
              key={est.id}
              estabelecimento={est}
              href={`${baseLink}/${est.tipo_estabelecimento}/${est.slug}`}
            />
          ))}
        </div>

        {total === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-neutral-500">Nenhum estabelecimento encontrado neste bairro ainda.</p>
            {cidade && (
              <Link
                href={`/${cidade}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                Explorar outros bairros de {cidade} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// -------- TIPO NO BAIRRO (ex: /salvador/pituba/restaurante) --------
async function TipoNoBairroPage({ cidade, bairro, tipo }: { cidade: string; bairro: string; tipo: string }) {
  const supabase = await createClient()

  // "bairro" aqui é o slug vindo da URL — resolve pro registro real
  const { data: bairroRow } = await supabase.from('bairros').select('id, nome').eq('slug', bairro).maybeSingle()
  const nomeBairro = bairroRow?.nome || bairro

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade', cidade)
    .eq('bairro_id', bairroRow?.id || '00000000-0000-0000-0000-000000000000')
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })

  const baseLink = `/${cidade}/${bairro}/${tipo}`
  const total = estabelecimentos?.length || 0

  return (
    <div>
      <section
        className="relative overflow-hidden px-4 py-12 text-center text-white md:py-16"
        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
      >
        <div className="relative z-10 mx-auto max-w-2xl">
          <Link href={`/${cidade}/${bairro}`} className="text-sm text-white/80 hover:underline">
            ← {nomeBairro}
          </Link>
          <h1 className="mt-1 text-3xl font-black capitalize tracking-tight md:text-4xl">
            {ICONES_TIPO_ESTABELECIMENTO[tipo] || '🏪'} {tipo.replace(/_/g, ' ')}
          </h1>
          <p className="mt-2 text-sm text-white/90 md:text-base">
            {nomeBairro}, {cidade} · {total} {total === 1 ? 'encontrado' : 'encontrados'}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {estabelecimentos?.map((est) => (
            <EstablishmentCard key={est.id} estabelecimento={est} href={`${baseLink}/${est.slug}`} />
          ))}
        </div>
        {total === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-neutral-500">Nenhum estabelecimento encontrado com esses filtros.</p>
            <Link
              href={`/${cidade}/${bairro}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--brand-primary)' }}
            >
              Ver todo o bairro {bairro} →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ESTABELECIMENTO (página completa) – CORRIGIDO
// ============================================================

async function EstabelecimentoPage({
  cidade,
  bairro,
  tipo,
  slug,
}: {
  cidade: string
  bairro: string
  tipo: string
  slug: string
}) {
  const supabase = await createClient()

  // "slug" é único por estabelecimento, então ele sozinho já basta pra
  // encontrar o registro certo — cidade/bairro/tipo na URL servem só pra
  // formar o link "bonito", não são necessários pra localizar a linha.
  // (Antes havia aqui uma cadeia de até 3 buscas em série, incluindo uma
  // tentativa de detectar "coluna inexistente" — nenhuma das colunas
  // usadas (cidade, tipo_estabelecimento, bairro_id) deixou de existir;
  // o motivo real de não achar com todos os filtros era simplesmente um
  // bairro/tipo desatualizado na URL, então a segunda tentativa nunca
  // resolvia nada que a busca só por slug já não resolvesse.)
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('*, estabelecimento_tipos_cozinha(tipos_cozinha(nome))')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .maybeSingle()

  if (!est) notFound()

  return <EstabelecimentoDetalhes est={est} />
}

// ============================================================
// COMPONENTE DE DETALHES DO ESTABELECIMENTO
// ============================================================

async function EstabelecimentoDetalhes({ est }: { est: any }) {
  const supabase = await createClient()

  // Buscar horários de funcionamento
  const { data: horarios } = await supabase
    .from('horarios_funcionamento')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .order('dia_semana')

  // Seções ativadas pelo admin geral da plataforma (mesma fonte usada na
  // tela /admin/configuracoes) — controla o que aparece nesta página,
  // igual pra todos os estabelecimentos.
  const { data: paletaESecoes } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'secoes_estabelecimento')
    .maybeSingle()

  const SECOES_PADRAO = [
    { chave: 'capa', ativa: true, ordem: 0 },
    { chave: 'sobre', ativa: true, ordem: 1 },
    { chave: 'cardapio_destaque', ativa: true, ordem: 2 },
    { chave: 'galeria', ativa: true, ordem: 3 },
    { chave: 'horarios', ativa: true, ordem: 4 },
    { chave: 'localizacao', ativa: true, ordem: 5 },
    { chave: 'comodidades', ativa: true, ordem: 6 },
    { chave: 'avaliacoes_google', ativa: false, ordem: 7 },
    { chave: 'contato', ativa: true, ordem: 8 },
    { chave: 'promocoes', ativa: true, ordem: 9 },
  ]

  const secoesConfig: { chave: string; ativa: boolean; ordem: number }[] =
    (paletaESecoes?.value as any) || SECOES_PADRAO

  const secaoAtiva = (chave: string) =>
    secoesConfig.find((s) => s.chave === chave)?.ativa ?? false

  const ordemSecoes = [...secoesConfig].sort((a, b) => a.ordem - b.ordem).map((s) => s.chave)

  // Promoções ativas desse estabelecimento (só busca se a seção estiver ligada)
  let promocoes: any[] = []
  if (secaoAtiva('promocoes')) {
    const { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', est.id)
      .eq('ativo', true)
      .maybeSingle()

    if (menu) {
      const { data: categorias } = await supabase
        .from('categorias')
        .select('id')
        .eq('menu_id', menu.id)

      const categoriaIds = (categorias || []).map((c) => c.id)
      if (categoriaIds.length > 0) {
        const { data: itensPromo } = await supabase
          .from('itens_cardapio')
          .select('*')
          .in('categoria_id', categoriaIds)
          .eq('promo_status', 'active')
          .not('preco_promocional', 'is', null)
          .limit(6)
        promocoes = itensPromo || []
      }
    }
  }

  const galeriaFotos: string[] = est.galeria_fotos || []
  const statusAberto = isEstabelecimentoAberto(horarios || [])

  const enderecoCompleto = est.endereco
    ? `${[est.tipo_logradouro, est.endereco].filter(Boolean).join(' ')}${est.numero ? ', ' + est.numero : ''}, ${est.bairro}, ${est.cidade || 'Salvador'}, BA`
    : `${est.bairro}, ${est.cidade || 'Salvador'}, BA`

  // O admin pode preencher um link de Google Maps manualmente — ele tem
  // prevalência sobre o endereço geocodificado. Só funciona de verdade
  // como mapa incorporado se for um link "Compartilhar → Incorporar um
  // mapa" (contém "/maps/embed"); um link comum de "Compartilhar local"
  // não é aceito pelo Google dentro de iframe, então nesses casos cai de
  // volta pro endereço geocodificado, que sempre funciona incorporado.
  const linkCustomizado = est.link_google_maps?.trim() || null
  const linkCustomizadoEhEmbed = !!linkCustomizado && linkCustomizado.includes('/maps/embed')

  const mapUrl = linkCustomizadoEhEmbed
    ? linkCustomizado
    : est.latitude && est.longitude
    ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`

  // Link "abrir no Google Maps" (fora do iframe) — quando o admin preenche
  // um link comum de "Compartilhar local" (não incorporável), ele não serve
  // pro iframe, mas ainda tem prevalência aqui: sem isso, esse tipo de link
  // ficava sem nenhum efeito na página pública, mesmo preenchido.
  const linkAbrirMapa =
    linkCustomizado ||
    (est.latitude && est.longitude
      ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16`
      : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}`)

  const nomeExibicao = est.nome_fantasia || est.nome
  const cidade = est.cidade || 'Salvador'
  const bairro = est.bairro

  const ETIQUETA_ESTACIONAMENTO: Record<string, { emoji: string; chave: string; texto: string }> = {
    proprio: { emoji: '🅿️', chave: 'estacionamento_proprio', texto: 'Estacionamento próprio' },
    valet: { emoji: '🚗', chave: 'estacionamento_manobrista', texto: 'Manobrista' },
    rua: { emoji: '🅿️', chave: 'estacionamento_rua', texto: 'Estacionamento na rua' },
    nao_tem: { emoji: '🚫', chave: 'estacionamento_sem', texto: 'Sem estacionamento' },
  }

  const temComodidade =
    est.aceita_pets || est.estacionamento || (est.acessibilidade && est.acessibilidade.length > 0)

  // Tradução manual do cardápio (EN/FR/ES) — mesmo mecanismo do
  // cardapio/[slug]/page.tsx; aqui só a seção de Promoções mostra nome de
  // item (sem descrição, sem categoria).
  const idiomasAtivos: string[] = est.idiomas_ativos || []
  let traducoes: TraducaoRow[] = []
  let traducoesInterface: TraducaoInterfaceRow[] = []
  if (idiomasAtivos.length > 0) {
    const [{ data: trads }, { data: tradsInterface }] = await Promise.all([
      supabase
        .from('traducoes')
        .select('tipo_registro, registro_id, idioma, campo, valor')
        .eq('estabelecimento_id', est.id),
      // Textos fixos da interface — globais da plataforma, cadastrados uma
      // vez pelo admin geral em /admin/traducoes-interface.
      supabase.from('traducoes_interface').select('chave, idioma, valor'),
    ])
    traducoes = trads || []
    traducoesInterface = tradsInterface || []
  }

  return (
    <TraducaoProvider slug={est.slug} idiomasAtivos={idiomasAtivos} traducoes={traducoes} traducoesInterface={traducoesInterface}>
    <div className="pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {/* Hero – foto de capa dedicada (mesma fonte de verdade usada no
            cardápio simples e nas listagens). Cai pra primeira foto da
            galeria se o estabelecimento ainda não subiu uma capa própria.
            Controlado pelo toggle "Capa" em /admin/configuracoes → Seções
            da página do estabelecimento. */}
        {secaoAtiva('capa') && (est.foto_capa || galeriaFotos.length > 0) && (
          <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl md:h-80">
            <Image src={est.foto_capa || galeriaFotos[0]} alt={nomeExibicao} fill sizes="(max-width: 768px) 100vw, 1024px" className="object-cover" />
          </div>
        )}

        {/* Card principal */}
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          {idiomasAtivos.length > 0 && (
            <div className="mb-2 flex justify-end">
              <SeletorIdioma idiomasAtivos={idiomasAtivos} />
            </div>
          )}
          <div className="flex items-start gap-4">
            {est.logo_url && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-neutral-200">
                <Image src={est.logo_url} alt={nomeExibicao} fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                <span className="capitalize">{est.tipo_estabelecimento || <TextoInterface chave="tipo_estabelecimento_fallback">Restaurante</TextoInterface>}</span>
                {(est.estabelecimento_tipos_cozinha || [])
                  .map((v: any) => v.tipos_cozinha?.nome)
                  .filter(Boolean)
                  .map((nome: string) => (
                    <span key={nome} className="flex items-center gap-2">
                      <span className="text-neutral-300">•</span>
                      <span>{nome}</span>
                    </span>
                  ))}
                {statusAberto.exibir && statusAberto.estado && (
                  <StatusPill aberto={statusAberto.aberto} estado={statusAberto.estado} horaAbertura={statusAberto.horaAbertura} />
                )}
              </div>
            </div>
          </div>
          {est.descricao && (
            <div
              className="prose prose-sm mt-4 max-w-none text-sm leading-relaxed text-neutral-700"
              dangerouslySetInnerHTML={{ __html: est.descricao }}
            />
          )}
          {!est.owner_user_id && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-sm text-orange-900">
                <strong><TextoInterface chave="reivindicar_titulo">Esse é o seu estabelecimento?</TextoInterface></strong>{' '}
                <TextoInterface chave="reivindicar_texto_perfil">
                  Reivindique o perfil para editar informações, fotos e cardápio.
                </TextoInterface>
              </p>
              <a
                href={`/estabelecimentos/novo?cnpj=${est.cnpj}`}
                className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                <TextoInterface chave="reivindicar_botao">Reivindicar</TextoInterface>
              </a>
            </div>
          )}
        </div>

        {/* Seções — controladas pelo admin geral (/admin/configuracoes) */}
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          <div className="space-y-8 p-6">
            {ordemSecoes.map((chave) => {
              if (!secaoAtiva(chave)) return null

              switch (chave) {
                case 'sobre':
                  return (
                    <div key={chave}>
                      <h2 className="mb-4 text-lg font-semibold text-neutral-800">
                        📝 <TextoInterface chave="secao_sobre">Sobre</TextoInterface>
                      </h2>
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-neutral-700">
                          <TextoInterface chave="endereco_label">Endereço</TextoInterface>
                        </h3>
                        <p className="text-sm text-neutral-700">
                          {[[est.tipo_logradouro, est.endereco].filter(Boolean).join(' '), est.numero]
                            .filter(Boolean)
                            .join(', ') || <TextoInterface chave="endereco_nao_informado">Endereço não informado</TextoInterface>}
                        </p>
                        <p className="text-xs text-neutral-500">{bairro} - {cidade}, BA</p>
                      </div>
                    </div>
                  )

                case 'cardapio_destaque':
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        📋 <TextoInterface chave="secao_cardapio">Cardápio</TextoInterface>
                      </h2>
                      <Link
                        href={`/cardapio/${est.slug}`}
                        className="inline-block rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        <TextoInterface chave="ver_cardapio_completo">Ver cardápio completo</TextoInterface> →
                      </Link>
                    </div>
                  )

                case 'galeria':
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        📸 <TextoInterface chave="secao_fotos">Fotos</TextoInterface>
                      </h2>
                      <GaleriaEstabelecimento fotos={galeriaFotos} nome={nomeExibicao} />
                    </div>
                  )

                case 'horarios':
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        🕒 <TextoInterface chave="secao_horarios">Horários</TextoInterface>
                      </h2>
                      {horarios && horarios.length > 0 ? (
                        <div className="space-y-3">
                          {[
                            { dia: 'Domingo', chave: 'dia_domingo' },
                            { dia: 'Segunda', chave: 'dia_segunda' },
                            { dia: 'Terça', chave: 'dia_terca' },
                            { dia: 'Quarta', chave: 'dia_quarta' },
                            { dia: 'Quinta', chave: 'dia_quinta' },
                            { dia: 'Sexta', chave: 'dia_sexta' },
                            { dia: 'Sábado', chave: 'dia_sabado' },
                          ].map(({ dia, chave: chaveDia }, idx) => {
                            const periodos = horarios.filter((h: any) => h.dia_semana === idx)
                            const hoje = new Date().getDay() === idx
                            const todosFechados = periodos.every((h: any) => h.fechado)
                            return (
                              <div
                                key={idx}
                                className={`rounded-xl p-3 text-sm border ${
                                  hoje ? 'border-[var(--brand-primary)]/30' : 'border-neutral-100 bg-neutral-50'
                                }`}
                                style={hoje ? { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, white)' } : undefined}
                              >
                                <div className="flex items-start justify-between">
                                  <span className="font-medium">
                                    {hoje && '👉 '}
                                    <TextoInterface chave={chaveDia}>{dia}</TextoInterface>
                                  </span>
                                  <div className="text-right">
                                    {todosFechados ? (
                                      <span className="text-red-500"><TextoInterface chave="fechado">Fechado</TextoInterface></span>
                                    ) : (
                                      periodos.map((h: any, i: number) => (
                                        <div key={i} className="text-neutral-700">
                                          {h.horario_abertura?.substring(0, 5) || '--'} – {h.horario_fechamento?.substring(0, 5) || '--'}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="py-6 text-center text-sm text-neutral-500">
                          <TextoInterface chave="horarios_nao_cadastrados">Horários não cadastrados.</TextoInterface>
                        </p>
                      )}
                    </div>
                  )

                case 'localizacao':
                  return (
                    <div key={chave}>
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-neutral-800">
                          📍 <TextoInterface chave="secao_localizacao">Localização</TextoInterface>
                        </h2>
                        <a
                          href={linkAbrirMapa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-orange-600 hover:underline"
                        >
                          <TextoInterface chave="abrir_google_maps">Abrir no Google Maps</TextoInterface>
                        </a>
                      </div>
                      <div className="h-56 w-full overflow-hidden rounded-xl border border-neutral-200">
                        <iframe
                          src={mapUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                          loading="lazy"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )

                case 'comodidades':
                  if (!temComodidade) return null
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        ✨ <TextoInterface chave="secao_comodidades">Comodidades</TextoInterface>
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {est.aceita_pets && (
                          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                            🐾 <TextoInterface chave="aceita_pets">Aceita pets</TextoInterface>
                          </span>
                        )}
                        {est.estacionamento && est.estacionamento !== 'nao_tem' && (
                          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                            {ETIQUETA_ESTACIONAMENTO[est.estacionamento].emoji}{' '}
                            <TextoInterface chave={ETIQUETA_ESTACIONAMENTO[est.estacionamento].chave}>
                              {ETIQUETA_ESTACIONAMENTO[est.estacionamento].texto}
                            </TextoInterface>
                          </span>
                        )}
                        {(est.acessibilidade || []).map((item: string, i: number) => (
                          <span key={i} className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                            ♿ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )

                case 'contato':
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        📞 <TextoInterface chave="secao_contato">Contato</TextoInterface>
                      </h2>
                      <div className="space-y-1 text-sm text-neutral-700">
                        {est.telefone && <p>📞 {est.telefone}</p>}
                        {est.whatsapp && <p>💬 {est.whatsapp}</p>}
                        {est.instagram && <p>📷 {est.instagram}</p>}
                        {!est.telefone && !est.whatsapp && !est.instagram && (
                          <p className="text-neutral-400">
                            <TextoInterface chave="contato_nao_informado">Contato não informado</TextoInterface>
                          </p>
                        )}
                      </div>
                    </div>
                  )

                case 'promocoes':
                  if (promocoes.length === 0) return null
                  return (
                    <div key={chave}>
                      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
                        🎉 <TextoInterface chave="secao_promocoes">Promoções</TextoInterface>
                      </h2>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {promocoes.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3">
                            {item.foto_url && (
                              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                                <Image src={item.foto_url} alt={item.nome} fill sizes="56px" className="object-cover" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                <Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto>
                              </p>
                              <p className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                                R$ {(item.preco_promocional ?? item.preco)?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'avaliacoes_google':
                  return <SecaoAvaliacoesGoogle key={chave} estabelecimentoId={est.id} />

                default:
                  return null
              }
            })}
          </div>
        </div>
      </div>
    </div>
    </TraducaoProvider>
  )
}