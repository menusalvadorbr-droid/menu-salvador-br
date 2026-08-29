import { createClient } from '@/lib/supabase/server'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function PaginaCulinaria({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tipoCozinha } = await supabase
    .from('tipos_cozinha')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tipoCozinha) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-800">Culinária não encontrada</h1>
      </div>
    )
  }

  // Estabelecimentos que possuem esse tipo de culinária — join com a tabela
  // de junção estabelecimento_tipos_cozinha, filtrado pela coluna relacionada.
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos_publico')
    .select('*, estabelecimento_tipos_cozinha!inner(tipo_cozinha_id)')
    .eq('estabelecimento_tipos_cozinha.tipo_cozinha_id', tipoCozinha.id)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header className="space-y-2 text-center">
        {tipoCozinha.icone && <span className="text-4xl">{tipoCozinha.icone}</span>}
        <h1 className="text-4xl font-bold text-neutral-900">{tipoCozinha.nome}</h1>
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
    </div>
  )
}
