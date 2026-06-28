import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ClaimForm from './ClaimForm'

interface PageProps {
  searchParams: Promise<{ slug: string }>
}

export default async function ClaimPage({ searchParams }: PageProps) {
  const { slug } = await searchParams

  if (!slug) redirect('/')

  const supabase = await createClient()

  // Buscar estabelecimento
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, slug, owner_user_id')
    .eq('slug', slug)
    .maybeSingle()

  if (!est) notFound()

  // Se já tem dono, redireciona
  if (est.owner_user_id) {
    redirect(`/${slug}`)
  }

  // Verifica se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/claim?slug=${slug}`)
  }

  // Verifica se já tem claim pendente
  const { data: existing } = await supabase
    .from('restaurant_claims')
    .select('id, status')
    .eq('estabelecimento_id', est.id)
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (existing?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-amber-700">Solicitação em análise</h2>
          <p className="text-gray-600 mt-2">Aguardando aprovação do administrador.</p>
          <Link href="/" className="inline-block mt-4 text-orange-600 hover:underline">Voltar</Link>
        </div>
      </div>
    )
  }

  if (existing?.status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-green-700">Já aprovado!</h2>
          <p className="text-gray-600 mt-2">Você já é o dono deste estabelecimento.</p>
          <Link href="/painel" className="inline-block mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">Ir para o painel</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Reivindicar {est.nome}</h1>
        <p className="text-center text-gray-600 mb-8">Preencha os dados para solicitar a propriedade.</p>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <ClaimForm estabelecimentoId={est.id} userId={user.id} estabelecimentoNome={est.nome} />
        </div>
      </div>
    </div>
  )
}