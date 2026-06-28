import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { moderarEstabelecimento, excluirEstabelecimento } from './actions'

export default async function AdminEstabelecimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      active: { label: '✅ Ativo', bg: 'bg-green-50', text: 'text-green-700' },
      pending_review: { label: '⏳ Pendente', bg: 'bg-yellow-50', text: 'text-yellow-700' },
      blocked: { label: '🚫 Bloqueado', bg: 'bg-red-50', text: 'text-red-700' },
    }
    return map[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  const total = estabelecimentos?.length || 0
  const ativos = estabelecimentos?.filter(e => e.status === 'active').length || 0
  const pendentes = estabelecimentos?.filter(e => e.status === 'pending_review').length || 0
  const bloqueados = estabelecimentos?.filter(e => e.status === 'blocked').length || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏪 Estabelecimentos</h1>
          <p className="text-sm text-gray-500">Gerencie todos os estabelecimentos da plataforma</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1">
          ← Voltar ao admin
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{ativos}</p>
          <p className="text-xs text-gray-500">Ativos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-yellow-600">{pendentes}</p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-red-600">{bloqueados}</p>
          <p className="text-xs text-gray-500">Bloqueados</p>
        </div>
      </div>

      {/* Lista de cards */}
      {estabelecimentos && estabelecimentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {estabelecimentos.map((est) => {
            const badge = getStatusBadge(est.status)
            const isActive = est.status === 'active'
            const isPending = est.status === 'pending_review'
            const isBlocked = est.status === 'blocked'

            return (
              <div
                key={est.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {est.nome_fantasia || est.nome}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">/{est.slug}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {est.owner_user_id ? '🔗 Vinculado' : '📌 Sem dono'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Aprovar (só se pendente) */}
                  {isPending && (
                    <form action={async () => {
                      'use server'
                      await moderarEstabelecimento(est.id, 'approve')
                    }}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        ✅ Aprovar
                      </button>
                    </form>
                  )}

                  {/* Bloquear (se não estiver bloqueado) */}
                  {!isBlocked && (
                    <form action={async () => {
                      'use server'
                      await moderarEstabelecimento(est.id, 'block')
                    }}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        🚫 Bloquear
                      </button>
                    </form>
                  )}

                  {/* Desbloquear (se estiver bloqueado) */}
                  {isBlocked && (
                    <form action={async () => {
                      'use server'
                      await moderarEstabelecimento(est.id, 'unblock')
                    }}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        🔓 Desbloquear
                      </button>
                    </form>
                  )}

                  {/* Desvincular (se tiver dono) */}
                  {est.owner_user_id && (
                    <form action={async () => {
                      'use server'
                      await moderarEstabelecimento(est.id, 'unlink')
                    }}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        🔓 Desvincular
                      </button>
                    </form>
                  )}

                  {/* Excluir (sempre disponível) */}
                  <form
                    action={async () => {
                      'use server'
                      if (confirm(`Tem certeza que deseja excluir permanentemente "${est.nome_fantasia || est.nome}"? Esta ação não pode ser desfeita.`)) {
                        await excluirEstabelecimento(est.id)
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                    >
                      🗑️ Excluir
                    </button>
                  </form>

                  {/* Ver público */}
                  <Link
                    href={`/${est.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    👁️ Ver
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-lg font-medium">Nenhum estabelecimento cadastrado</p>
          <p className="text-sm">Os estabelecimentos aparecerão aqui assim que forem criados.</p>
        </div>
      )}
    </div>
  )
}