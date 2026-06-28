import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// ============================================================
// SERVER ACTION: LOGOUT (apenas isso é novo)
// ============================================================
async function handleLogout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// PÁGINA (mantida 99% igual)
// ============================================================

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 🔥 NOVO: verifica se é super_admin (para mostrar link Admin)
  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.role === 'super_admin'

  // Buscar estabelecimentos do dono (igual)
  const { data: estabelecimentos, error } = await supabase
    .from('estabelecimentos')
    .select('id, nome, slug, status, foto_capa, ativo')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar estabelecimentos:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 🔥 CABEÇALHO MODIFICADO: adiciona botões */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meus Estabelecimentos</h1>
            <p className="text-gray-600">Bem‑vindo, <strong>{user.email}</strong>!</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 🔥 NOVO: Link Admin (só se for super_admin) */}
            {isSuperAdmin && (
              <Link
                href="/admin"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                🔐 Admin
              </Link>
            )}
            {/* 🔥 NOVO: Botão Logout */}
            <form action={handleLogout}>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Sair
              </button>
            </form>
            {/* 🔥 Botão Novo Estabelecimento (já existia, só movi para dentro do flex) */}
            <Link
              href="/estabelecimentos/novo"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              + Novo Estabelecimento
            </Link>
          </div>
        </div>

        {/* Resto do código IGUAL */}
        {estabelecimentos && estabelecimentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estabelecimentos.map((est) => (
              <div key={est.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
                {est.foto_capa && (
                  <img
                    src={est.foto_capa}
                    alt={est.nome}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{est.nome}</h3>
                  <p className="text-sm text-gray-500">/{est.slug}</p>
                  <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      est.status === 'active' ? 'bg-green-100 text-green-700' :
                      est.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {est.status === 'active' ? '✅ Ativo' :
                       est.status === 'pending_review' ? '⏳ Pendente' :
                       est.status}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/painel/estabelecimento/${est.id}/editar`}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Gerenciar
                      </Link>
                      <Link
                        href={`/${est.slug}`}
                        className="text-sm text-orange-600 hover:underline"
                        target="_blank"
                      >
                        Ver público →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Você ainda não tem estabelecimentos cadastrados.</p>
            <Link
              href="/estabelecimentos/novo"
              className="inline-block mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Cadastrar meu primeiro estabelecimento
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}