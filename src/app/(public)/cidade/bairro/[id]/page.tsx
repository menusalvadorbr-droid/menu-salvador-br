import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'

export default async function PaginaBairro({ params }: { params: Promise<{ id: string }> }) {
  const { id: bairroId } = await params
  const supabase = await createClient()

  // Buscar o bairro (para saber o nome e, se quiser, a cidade)
  const { data: bairro, error: bairroError } = await supabase
    .from('bairros')
    .select('id, nome')
    .eq('id', bairroId)
    .maybeSingle()

  // Se o bairro não existir, retorna 404
  if (bairroError || !bairro) {
    notFound()
  }

  // Buscar estabelecimentos do bairro
  const { data: estabelecimentos, error: estabError } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('bairro', bairro.nome) // ← usa o nome do bairro como filtro
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .order('nome', { ascending: true })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={bairro.nome}
        subtitle={estabelecimentos?.length ? `${estabelecimentos.length} estabelecimentos encontrados` : 'Nenhum estabelecimento encontrado'}
        align="center"
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {estabelecimentos?.map((est) => (
          <EstablishmentCard
            key={est.id}
            estabelecimento={est}
            href={`/${est.slug}`}
          />
        ))}
      </div>

      {(!estabelecimentos || estabelecimentos.length === 0) && (
        <p className="py-12 text-center text-neutral-500">
          Nenhum estabelecimento encontrado neste bairro.
        </p>
      )}
    </div>
  )
}