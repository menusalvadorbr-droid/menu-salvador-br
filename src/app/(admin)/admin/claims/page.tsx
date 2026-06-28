import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { moderarClaim } from './actions'

export default async function AdminClaimsPage() {
  // Verifica autenticação e permissão (segurança extra)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') redirect('/painel')

  // Busca claims pendentes usando supabaseAdmin (ignora RLS)
  const { data: claims, error } = await supabaseAdmin
    .from('restaurant_claims')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar claims:', error)
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
          <h2 className="text-xl font-bold">Erro ao carregar reivindicações</h2>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  // Busca dados relacionados manualmente
  const claimsComDados = []
  for (const claim of claims || []) {
    const { data: estabelecimento } = await supabaseAdmin
      .from('estabelecimentos')
      .select('id, nome, slug')
      .eq('id', claim.estabelecimento_id)
      .single()

    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nome')
      .eq('id', claim.usuario_id)
      .single()

    claimsComDados.push({
      ...claim,
      estabelecimentos: estabelecimento,
      usuarios: usuario,
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📋 Reivindicações Pendentes</h1>
          <p className="text-gray-500 mt-1">
            {claimsComDados.length} solicitações aguardando análise
          </p>
        </div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition">
          ← Voltar ao admin
        </Link>
      </div>

      {claimsComDados.length > 0 ? (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estabelecimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {claimsComDados.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {claim.estabelecimentos?.nome || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      /{claim.estabelecimentos?.slug || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {claim.usuarios?.nome || claim.usuarios?.email || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {claim.usuarios?.email || ''}
                    </div>
                    {claim.proof_data && (
                      <div className="text-xs text-gray-400 mt-1">
                        📎 {claim.proof_data.nome || 'Comprovante enviado'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(claim.created_at).toLocaleDateString('pt-BR')}
                    <br />
                    <span className="text-xs text-gray-400">
                      {new Date(claim.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <form action={async () => {
                        'use server'
                        await moderarClaim(claim.id, 'approve', claim.estabelecimento_id, claim.usuario_id)
                      }}>
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                          ✅ Aprovar
                        </button>
                      </form>
                      <form action={async () => {
                        'use server'
                        await moderarClaim(claim.id, 'reject', claim.estabelecimento_id, claim.usuario_id)
                      }}>
                        <button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                        >
                          ❌ Rejeitar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-medium">Nenhuma reivindicação pendente</p>
          <p className="text-sm">Todas as solicitações foram analisadas.</p>
        </div>
      )}
    </div>
  )
}