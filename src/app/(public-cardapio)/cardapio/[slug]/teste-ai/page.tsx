import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/publicServer'
import AiWaiterChat from './AiWaiterChat'

// Rota de teste — não linkada em nenhum lugar do cardápio público, é a
// forma combinada de validar o AI Waiter antes de expor pra todo cliente.
export default async function TesteAiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: est } = await supabase
    .from('estabelecimentos_publico')
    .select('nome, nome_fantasia')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) notFound()

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <AiWaiterChat slug={slug} nomeEstabelecimento={est.nome_fantasia || est.nome} />
    </div>
  )
}
