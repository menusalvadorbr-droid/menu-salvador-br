import CardSkeleton from '@/components/public/CardSkeleton'

// Esqueletos de carregamento — um por seção da home, do tamanho
// aproximado da seção final, pra segurar o layout enquanto a consulta
// daquela seção especificamente ainda não terminou (ver (public)/page.tsx,
// cada seção é um <Suspense> independente).

export function SkeletonHero() {
  return (
    <div className="h-72 w-full animate-pulse bg-gradient-to-br from-neutral-200 to-neutral-300 md:h-80" />
  )
}

export function SkeletonFiltros() {
  return (
    <div className="border-b border-neutral-100 bg-white py-4">
      <div className="container mx-auto flex gap-3 overflow-x-hidden px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-14 flex-shrink-0 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonCarrossel() {
  return (
    <div className="bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 h-8 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="flex gap-6 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 min-w-[250px] flex-shrink-0 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonVitrine({ itens = 6 }: { itens?: number }) {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-neutral-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {Array.from({ length: itens }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonGrid({ cards = 6 }: { cards?: number }) {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-neutral-200" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonCta() {
  return <div className="h-40 w-full animate-pulse bg-neutral-100" />
}
