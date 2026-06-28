import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // Verifica se é super_admin
  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/painel')
  }

  // Estatísticas
  const { count: totalEstabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })

  const { count: claimsPendentes } = await supabase
    .from('restaurant_claims')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">⚙️ Painel Administrativo</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Estabelecimentos</p>
            <p className="text-3xl font-bold text-gray-800">{totalEstabelecimentos || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Usuários</p>
            <p className="text-3xl font-bold text-gray-800">{totalUsuarios || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Reivindicações pendentes</p>
            <p className="text-3xl font-bold text-amber-600">{claimsPendentes || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Planos ativos</p>
            <p className="text-3xl font-bold text-gray-800">-</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/estabelecimentos"
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition hover:border-orange-200"
          >
            <div className="text-4xl mb-2">🏪</div>
            <h2 className="text-xl font-semibold text-gray-800">Gerenciar Estabelecimentos</h2>
            <p className="text-sm text-gray-500 mt-1">Aprovar, bloquear e moderar</p>
          </Link>
          <Link
            href="/admin/claims"
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition hover:border-orange-200"
          >
            <div className="text-4xl mb-2">📋</div>
            <h2 className="text-xl font-semibold text-gray-800">Reivindicações</h2>
            <p className="text-sm text-gray-500 mt-1">Solicitações de donos</p>
          </Link>
          <Link
            href="/admin/planos"
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition hover:border-orange-200"
          >
            <div className="text-4xl mb-2">💰</div>
            <h2 className="text-xl font-semibold text-gray-800">Planos</h2>
            <p className="text-sm text-gray-500 mt-1">Assinaturas e preços</p>
          </Link>
          <Link
            href="/admin/temas"
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition hover:border-orange-200"
          >
            <div className="text-4xl mb-2">🎨</div>
            <h2 className="text-xl font-semibold text-gray-800">Temas</h2>
            <p className="text-sm text-gray-500 mt-1">Personalização visual</p>
          </Link>
        </div>
      </div>
    </div>
  )
}