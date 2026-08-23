import { createPublicClient } from '@/lib/supabase/publicServer'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EstablishmentCard, { type EstablishmentCardData } from '@/components/public/EstablishmentCard'
import GaleriaEstabelecimento from '@/components/public/GaleriaEstabelecimento'
import SectionHeading from '@/components/public/SectionHeading'
import StatusPill from '@/components/public/StatusPill'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import { horarioAtualSalvador } from '@/lib/horarioSalvador'
import SecaoAvaliacoesGoogle from '@/components/public/SecaoAvaliacoesGoogle'
import { TraducaoProvider, Texto, TextoInterface, SeletorIdioma, type TraducaoRow, type TraducaoInterfaceRow } from '@/components/public/TraducaoCardapio'
import type { Metadata } from 'next'

// ISR — troca de createClient() (cookie, sempre dinâmico) pro
// createPublicClient() (anon key, sem cookies) foi o que tornou isso
// possível aqui. A Home saiu desta rota (virou (public)/page.tsx própria —
// ver comentário lá) por causa disso: as seções dela usam o client de
// cookie e derrubavam a geração estática da rota inteira. As páginas que
// sobram aqui (cidade/bairro/tipo/estabelecimento, onde cai o scan de QR
// Code) passam a ser servidas do cache de borda.
export const revalidate = 120

// Sem isso (mesmo retornando vazio), o Next 16 trata rotas de segmento
// dinâmico como totalmente dinâmicas e ignora o revalidate acima por
// completo — confirmado via x-nextjs-cache (ausente sem isto, MISS→HIT com
// isto) em teste local com next build + next start. dynamicParams (padrão
// true) já cobre gerar sob demanda qualquer combinação de segmentos não
// devolvida aqui.
export async function generateStaticParams() {
  return []
}

// ============================================================
// RESOLUÇÃO DE SEGMENTO — por slug contra a tabela de referência, não
// mais por texto cru nem por "existe estabelecimento com esse valor"
// (esse segundo método dava falso-negativo pra cidade/tipo válidos sem
// nenhum estabelecimento ainda).
// ============================================================

interface CidadeRow {
  id: string
  nome: string
  slug: string
}

interface TipoEstabelecimentoRow {
  id: number
  nome: string
  slug: string
  icone: string | null
}

interface EstabelecimentoComTipo extends EstablishmentCardData {
  id: string
  slug: string
  tipos_estabelecimento: TipoEstabelecimentoRow | null
}

async function resolverCidade(slugCidade: string): Promise<CidadeRow | null> {
  const supabase = createPublicClient()
  const { data } = await supabase.from('cidades').select('id, nome, slug').eq('slug', slugCidade).maybeSingle()
  return data
}

async function resolverTipoEstabelecimento(slugTipo: string): Promise<TipoEstabelecimentoRow | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('tipos_estabelecimento')
    .select('id, nome, slug, icone')
    .eq('slug', slugTipo)
    .maybeSingle()
  return data
}

// ============================================================
// COMPONENTE PRINCIPAL (ÚNICA FUNÇÃO Page)
// ============================================================

// ============================================================
// SEO
// ============================================================

export async function generateMetadata(): Promise<Metadata> {
  // Home ganhou metadata própria em (public)/page.tsx. Demais rotas (cidade,
  // bairro, tipo, estabelecimento) seguem com o título genérico por
  // enquanto — cada uma pode ganhar metadata própria depois.
  return {}
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params

  // --- 4 segmentos: estabelecimento ---
  if (slug.length === 4) {
    const [cidadeSlug, bairroSlug, tipoSlug, slugEst] = slug
    return <EstabelecimentoPage cidadeSlug={cidadeSlug} bairroSlug={bairroSlug} tipoSlug={tipoSlug} slug={slugEst} />
  }

  // --- 3 segmentos: tipo no bairro ---
  if (slug.length === 3) {
    const [cidadeSlug, bairroSlug, tipoSlug] = slug
    return <TipoNoBairroPage cidadeSlug={cidadeSlug} bairroSlug={bairroSlug} tipoSlug={tipoSlug} />
  }

  // --- 2 segmentos: cidade+tipo ou cidade+bairro ---
  if (slug.length === 2) {
    const [primeiro, segundo] = slug
    const tipo = await resolverTipoEstabelecimento(segundo)
    if (tipo) {
      return <TipoNaCidadePage cidadeSlug={primeiro} tipo={tipo} />
    } else {
      return <BairroPage cidadeSlug={primeiro} bairroSlug={segundo} />
    }
  }

  // --- 1 segmento: cidade ou bairro ---
  if (slug.length === 1) {
    const [nome] = slug
    const cidade = await resolverCidade(nome)
    if (cidade) {
      return <CidadePage cidade={cidade} />
    } else {
      return <BairroPage bairroSlug={nome} />
    }
  }

  notFound()
}

// -------- CIDADE --------
async function CidadePage({ cidade }: { cidade: CidadeRow }) {
  const supabase = createPublicClient()
  const { data: tipos } = await supabase
    .from('estabelecimentos')
    .select('tipo_estabelecimento_id, tipos_estabelecimento(nome, slug, icone)')
    .eq('cidade_id', cidade.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .not('tipo_estabelecimento_id', 'is', null)

  const tiposUnicos = Array.from(
    new Map(
      ((tipos || []) as unknown as { tipo_estabelecimento_id: number; tipos_estabelecimento: TipoEstabelecimentoRow | null }[])
        .filter((t) => t.tipos_estabelecimento)
        .map((t) => [t.tipo_estabelecimento_id, t.tipos_estabelecimento as TipoEstabelecimentoRow])
    ).values()
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading title={cidade.nome} subtitle="Explore por categoria" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiposUnicos.map((tipo) => (
          <Link
            key={tipo.slug}
            href={`/${cidade.slug}/${tipo.slug}`}
            className="group rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-[var(--brand-primary)]/40"
          >
            <div className="mb-2 text-3xl">{tipo.icone || '🍽️'}</div>
            <h2 className="text-sm font-semibold text-neutral-800 group-hover:text-[var(--brand-primary)]">
              {tipo.nome}
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
async function TipoNaCidadePage({ cidadeSlug, tipo }: { cidadeSlug: string; tipo: TipoEstabelecimentoRow }) {
  const supabase = createPublicClient()
  const cidade = await resolverCidade(cidadeSlug)
  if (!cidade) notFound()

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*, bairros(nome, slug)')
    .eq('cidade_id', cidade.id)
    .eq('tipo_estabelecimento_id', tipo.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .not('bairro_id', 'is', null)
    .order('destaque', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={`${tipo.nome} em ${cidade.nome}`}
        subtitle={`${estabelecimentos?.length || 0} estabelecimentos encontrados`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {estabelecimentos?.map((est: any) => (
          <EstablishmentCard
            key={est.id}
            estabelecimento={est}
            href={
              est.bairros?.slug
                ? `/${cidade.slug}/${est.bairros.slug}/${tipo.slug}/${est.slug}`
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

// -------- BAIRRO (com ou sem cidade na URL) --------
async function BairroPage({ cidadeSlug, bairroSlug }: { cidadeSlug?: string; bairroSlug: string }) {
  const supabase = createPublicClient()

  // Cidade vem sempre do próprio bairro (cidade_id é obrigatório) — não
  // depende de um segmento de cidade na URL pra existir; se a URL tinha
  // 2 segmentos, só confere que bate com a cidade real do bairro.
  const { data: bairroRow } = await supabase
    .from('bairros')
    .select('id, nome, cidades(nome, slug)')
    .eq('slug', bairroSlug)
    .maybeSingle()

  if (!bairroRow) notFound()
  const cidadeDoBairro = (Array.isArray(bairroRow.cidades) ? bairroRow.cidades[0] : bairroRow.cidades) as
    | { nome: string; slug: string }
    | null
  if (cidadeSlug && cidadeDoBairro?.slug !== cidadeSlug) notFound()

  const nomeBairro = bairroRow.nome
  const cidadeSlugReal = cidadeDoBairro?.slug
  const nomeCidade = cidadeDoBairro?.nome

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*, tipos_estabelecimento(nome, slug, icone)')
    .eq('bairro_id', bairroRow.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .not('tipo_estabelecimento_id', 'is', null)
    .order('destaque', { ascending: false })
    .order('nome', { ascending: true })

  const baseLink = cidadeSlugReal ? `/${cidadeSlugReal}/${bairroSlug}` : `/${bairroSlug}`

  const estabelecimentosComTipo = (estabelecimentos || []) as unknown as EstabelecimentoComTipo[]

  const tiposPresentes = Array.from(
    new Map(
      estabelecimentosComTipo
        .filter((e) => e.tipos_estabelecimento)
        .map((e) => [e.tipos_estabelecimento!.slug, e.tipos_estabelecimento as TipoEstabelecimentoRow])
    ).values()
  )

  const total = estabelecimentosComTipo.length

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
          {cidadeSlugReal && (
            <Link href={`/${cidadeSlugReal}`} className="text-sm text-white/80 hover:underline">
              ← {nomeCidade}
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
                key={tipo.slug}
                href={`${baseLink}/${tipo.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand-primary)]/50 hover:text-[var(--brand-primary)]"
              >
                <span>{tipo.icone || '🏪'}</span>
                <span>{tipo.nome}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {estabelecimentosComTipo.map((est) => (
            <EstablishmentCard
              key={est.id}
              estabelecimento={est}
              href={est.tipos_estabelecimento?.slug ? `${baseLink}/${est.tipos_estabelecimento.slug}/${est.slug}` : `/cardapio/${est.slug}`}
            />
          ))}
        </div>

        {total === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-neutral-500">Nenhum estabelecimento encontrado neste bairro ainda.</p>
            {cidadeSlugReal && (
              <Link
                href={`/${cidadeSlugReal}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                Explorar outros bairros de {nomeCidade} →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// -------- TIPO NO BAIRRO (ex: /salvador/pituba/restaurante) --------
async function TipoNoBairroPage({ cidadeSlug, bairroSlug, tipoSlug }: { cidadeSlug: string; bairroSlug: string; tipoSlug: string }) {
  const supabase = createPublicClient()

  const [cidade, tipo, { data: bairroRow }] = await Promise.all([
    resolverCidade(cidadeSlug),
    resolverTipoEstabelecimento(tipoSlug),
    supabase.from('bairros').select('id, nome, cidade_id').eq('slug', bairroSlug).maybeSingle(),
  ])
  if (!cidade || !tipo || !bairroRow || bairroRow.cidade_id !== cidade.id) notFound()

  const nomeBairro = bairroRow.nome

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade_id', cidade.id)
    .eq('bairro_id', bairroRow.id)
    .eq('tipo_estabelecimento_id', tipo.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })

  const baseLink = `/${cidadeSlug}/${bairroSlug}/${tipoSlug}`
  const total = estabelecimentos?.length || 0

  return (
    <div>
      <section
        className="relative overflow-hidden px-4 py-12 text-center text-white md:py-16"
        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
      >
        <div className="relative z-10 mx-auto max-w-2xl">
          <Link href={`/${cidadeSlug}/${bairroSlug}`} className="text-sm text-white/80 hover:underline">
            ← {nomeBairro}
          </Link>
          <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
            {tipo.icone || '🏪'} {tipo.nome}
          </h1>
          <p className="mt-2 text-sm text-white/90 md:text-base">
            {nomeBairro}, {cidade.nome} · {total} {total === 1 ? 'encontrado' : 'encontrados'}
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
              href={`/${cidadeSlug}/${bairroSlug}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--brand-primary)' }}
            >
              Ver todo o bairro {nomeBairro} →
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

// cidadeSlug/bairroSlug/tipoSlug não são desestruturados de propósito —
// só existem na URL pra formar o link "bonito", não são necessários pra
// localizar o registro (ver comentário abaixo).
async function EstabelecimentoPage({
  slug,
}: {
  cidadeSlug: string
  bairroSlug: string
  tipoSlug: string
  slug: string
}) {
  const supabase = createPublicClient()

  // "slug" é único por estabelecimento (dentro da cidade), então ele
  // sozinho já basta pra encontrar o registro certo — cidade/bairro/tipo
  // na URL servem só pra formar o link "bonito", não são necessários pra
  // localizar a linha. (Antes havia aqui uma cadeia de até 3 buscas em
  // série, incluindo uma tentativa de detectar "coluna inexistente" —
  // nenhuma das colunas usadas deixou de existir; o motivo real de não
  // achar com todos os filtros era simplesmente um bairro/tipo
  // desatualizado na URL, então a segunda tentativa nunca resolvia nada
  // que a busca só por slug já não resolvesse.)
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('*, estabelecimento_tipos_cozinha(tipos_cozinha(nome)), cidades(nome, slug), bairros(nome, slug), tipos_estabelecimento(nome, slug, icone)')
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
  const supabase = createPublicClient()

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
  // Mesmo motivo do fuso corrigido em statusAberto.ts: new Date().getDay()
  // usa o fuso de onde o código roda (UTC no servidor), não o de Salvador
  // — marcava o dia errado como "hoje" na lista de horários à noite
  // (ex: 23h de quinta em Salvador já é sexta em UTC).
  const { diaSemana: diaSemanaHojeSalvador } = horarioAtualSalvador()

  // Nome real de cidade/bairro vem do join (cidades/bairros), não mais
  // do texto solto em estabelecimentos.cidade/bairro — esse texto nunca
  // é escrito pelos fluxos de cadastro atuais (ver src/lib/
  // resolverCidadeCadastro.ts), ficaria em branco pra estabelecimento
  // novo se ainda fosse a fonte usada aqui.
  const nomeCidadeReal = est.cidades?.nome || 'Salvador'
  const nomeBairroReal = est.bairros?.nome || null

  const enderecoCompleto = est.endereco
    ? `${[est.tipo_logradouro, est.endereco].filter(Boolean).join(' ')}${est.numero ? ', ' + est.numero : ''}${nomeBairroReal ? `, ${nomeBairroReal}` : ''}, ${nomeCidadeReal}, BA`
    : `${nomeBairroReal ? `${nomeBairroReal}, ` : ''}${nomeCidadeReal}, BA`

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
  const cidade = nomeCidadeReal
  const bairro = nomeBairroReal

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
                <span>{est.tipos_estabelecimento?.nome || <TextoInterface chave="tipo_estabelecimento_fallback">Restaurante</TextoInterface>}</span>
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
                        <p className="text-xs text-neutral-500">{bairro ? `${bairro} - ` : ''}{cidade}, BA</p>
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
                            const hoje = diaSemanaHojeSalvador === idx
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