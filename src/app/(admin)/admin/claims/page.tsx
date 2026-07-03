import { supabaseAdmin } from '@/lib/supabase/admin'
import { logSupabaseError } from '@/lib/supabase/logError'
import { moderarClaim } from './actions'

export default async function AdminClaimsPage() {
  // Busca claims pendentes usando supabaseAdmin (ignora RLS)
  const { data: claims, error } = await supabaseAdmin
    .from('restaurant_claims')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('Erro ao buscar claims:', error)
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h2 className="text-xl font-bold">Erro ao carregar reivindicações</h2>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    )
  }

  // Busca dados relacionados manualmente
  const claimsComDados: Array<Record<string, any>> = []
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
    <div>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reivindicações pendentes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {claimsComDados.length} solicitações aguardando análise
        </p>
      </div>

      {claimsComDados.length > 0 ? (
        <div className="mt-6 bg-white rounded-2xl shadow overflow-hidden">
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
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-medium">Nenhuma reivindicação pendente</p>
          <p className="text-sm">Todas as solicitações foram analisadas.</p>
        </div>
      )}
    </div>
  )
}