import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/publicServer'
import HeroSecao from '@/features/home/HeroSecao'
import FiltrosSecao from '@/features/home/FiltrosSecao'
import PromocoesSecao from '@/features/home/PromocoesSecao'
import ExplorarBairroSecao from '@/features/home/ExplorarBairroSecao'
import CategoriasPopularesSecao from '@/features/home/CategoriasPopularesSecao'
import RecomendadosSecao from '@/features/home/RecomendadosSecao'
import GridGeralSecao from '@/features/home/GridGeralSecao'
import CtaDonosSecao from '@/features/home/CtaDonosSecao'
import { SkeletonHero, SkeletonFiltros, SkeletonCarrossel, SkeletonVitrine, SkeletonGrid, SkeletonCta } from '@/features/home/skeletons'
import BotaoFlutuante from '@/features/home/BotaoFlutuante'
import PropagandaCard from '@/components/public/PropagandaCard'
import SecaoAnimada from '@/components/public/SecaoAnimada'

// Home separada do catch-all (public)/[...slug]/page.tsx de propósito —
// as seções abaixo (Hero, Filtros, Grid, etc.) usam @/lib/supabase/server
// (cookies()) cada uma, então tentar encaixar a Home dentro da mesma rota
// que ganhou generateStaticParams + revalidate (pras páginas de
// cidade/bairro/tipo/estabelecimento, onde cai o scan de QR Code) derrubava
// a Home inteira com DYNAMIC_SERVER_USAGE — um único fetch/leitura dinâmica
// sem Suspense em qualquer uma dessas seções (PropagandaCard, por exemplo,
// fica fora de Suspense) já é o bastante. Uma rota literal (sem segmento
// dinâmico) não sofre essa pressão: cai em dinâmica normal, sem erro, e sem
// artificial tentativa de geração estática. A Home nunca foi o alvo do ISR
// desta mudança — filtros mudam a cada busca, não faz sentido cachear.
export const metadata: Metadata = {
  title: 'menu.salvador — Cardápios digitais e restaurantes em Salvador',
  description:
    'Descubra bares, restaurantes e petiscarias em Salvador. Veja o cardápio digital, promoções do momento e peça direto pelo celular, sem baixar nenhum aplicativo.',
  openGraph: {
    title: 'menu.salvador — Cardápios digitais em Salvador',
    description: 'Descubra onde comer em Salvador e veja o cardápio sem baixar nada.',
    type: 'website',
  },
}

export default async function HomeRoute({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bairro?: string; tipo?: string }>
}) {
  const sp = await searchParams
  return <HomePage q={sp.q} bairroId={sp.bairro} tipoCozinhaId={sp.tipo} />
}

// Carregamento em camadas: cada seção abaixo é um Server Component
// assíncrono com sua própria consulta, dentro de <Suspense> — a mais
// lenta (Grid geral) não trava mais as outras, cada uma aparece assim
// que a consulta dela termina, na ordem sugerida (mais rápida/importante
// primeiro): Hero → Busca/Filtros → Promoções → Explorar por bairro /
// Categorias populares → Recomendados → Grid geral.
//
// Só configuracoes_home é buscado aqui, direto — é rápida (uma linha só)
// e decide quais seções sequer entram na árvore.
async function HomePage({
  q,
  bairroId,
  tipoCozinhaId,
}: {
  q?: string
  bairroId?: string
  tipoCozinhaId?: string
}) {
  const supabase = createPublicClient()
  const { data: config } = await supabase.from('configuracoes_home').select('*').eq('id', true).maybeSingle()

  const heroAtivado = config?.hero_ativado ?? true
  const buscaAtivado = config?.busca_ativado ?? true
  const promocoesAtivado = config?.promocoes_ativado ?? true
  const explorarBairroAtivado = config?.explorar_bairro_ativado ?? true
  const categoriasPopularesAtivado = config?.categorias_populares_ativado ?? true
  const recomendadosAtivado = config?.recomendados_ativado ?? true
  const gridAtivado = config?.grid_estabelecimentos_ativado ?? true
  const filtrosAtivado = config?.filtros_ativado ?? true
  const ctaDonosAtivado = config?.cta_donos_ativado ?? true
  const botaoFlutuanteAtivado = config?.botao_flutuante_ativado ?? true

  return (
    <div>
      {heroAtivado && (
        <Suspense fallback={<SkeletonHero />}>
          <HeroSecao buscaAtivado={buscaAtivado} qInicial={q} bairroAtual={bairroId} tipoAtual={tipoCozinhaId} />
        </Suspense>
      )}

      {gridAtivado && filtrosAtivado && (
        <Suspense fallback={<SkeletonFiltros />}>
          <FiltrosSecao />
        </Suspense>
      )}

      <SecaoAnimada className="mx-auto max-w-6xl px-4 pt-6">
        <PropagandaCard />
      </SecaoAnimada>

      {promocoesAtivado && (
        <Suspense fallback={<SkeletonCarrossel />}>
          <SecaoAnimada>
            <PromocoesSecao />
          </SecaoAnimada>
        </Suspense>
      )}

      {explorarBairroAtivado && (
        <Suspense fallback={<SkeletonVitrine itens={8} />}>
          <SecaoAnimada>
            <ExplorarBairroSecao />
          </SecaoAnimada>
        </Suspense>
      )}

      {categoriasPopularesAtivado && (
        <Suspense fallback={<SkeletonVitrine itens={12} />}>
          <SecaoAnimada>
            <CategoriasPopularesSecao />
          </SecaoAnimada>
        </Suspense>
      )}

      {recomendadosAtivado && (
        <Suspense fallback={<SkeletonGrid cards={3} />}>
          <SecaoAnimada>
            <RecomendadosSecao />
          </SecaoAnimada>
        </Suspense>
      )}

      {gridAtivado && (
        <Suspense fallback={<SkeletonGrid />}>
          <SecaoAnimada className="container mx-auto px-4 py-10">
            <GridGeralSecao q={q} bairroId={bairroId} tipoCozinhaId={tipoCozinhaId} />
          </SecaoAnimada>
        </Suspense>
      )}

      {ctaDonosAtivado && (
        <Suspense fallback={<SkeletonCta />}>
          <CtaDonosSecao />
        </Suspense>
      )}

      {botaoFlutuanteAtivado && <BotaoFlutuante />}
    </div>
  )
}
