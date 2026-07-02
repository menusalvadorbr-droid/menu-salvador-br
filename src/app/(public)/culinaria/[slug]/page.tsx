import { createClient } from '@/lib/supabase/server'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function PaginaCulinaria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: culinaria } = await supabase
    .from('culinarias')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!culinaria) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-800">Culinária não encontrada</h1>
      </div>
    )
  }

  // Estabelecimentos que possuem essa culinária.
  // Antes usava `.contains()` num join, o que não filtra corretamente pela
  // tabela de junção — a forma correta no Supabase/PostgREST é um inner join
  // filtrado pela coluna da tabela relacionada.
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*, estabelecimentos_culinarias!inner(culinaria_id)')
    .eq('estabelecimentos_culinarias.culinaria_id', culinaria.id)
    .order('nome', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-3">
          {culinaria.emoji && <span className="text-4xl">{culinaria.emoji}</span>}
          {culinaria.icon_svg && (
            <img src={culinaria.icon_svg} alt={culinaria.nome} className="h-10 w-10 object-contain" />
          )}
        </div>
        <h1 className="text-4xl font-bold text-neutral-900">{culinaria.nome}</h1>
        <p className="text-sm text-neutral-500">Restaurantes e pratos dessa culinária</p>
      </header>

      <section className="space-y-4">
        <SectionHeading title="Estabelecimentos" />

        {(!estabelecimentos || estabelecimentos.length === 0) && (
          <p className="text-neutral-600">Nenhum estabelecimento encontrado.</p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {estabelecimentos?.map((est: any) => (
            <EstablishmentCard key={est.id} estabelecimento={est} href={`/cardapio/${est.slug}`} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="Pratos populares" />
        <p className="text-sm text-neutral-500">(Você pode ativar essa seção no admin futuramente)</p>
      </section>
    </div>
  )
}
