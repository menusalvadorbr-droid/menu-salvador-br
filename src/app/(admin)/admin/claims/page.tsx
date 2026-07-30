import { supabaseAdmin } from '@/lib/supabase/admin'
import { logSupabaseError } from '@/lib/supabase/logError'
import { moderarClaim } from './actions'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

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
      .select('id, nome, slug, galeria_fotos')
      .eq('id', claim.estabelecimento_id)
      .single()

    const { data: usuario } = await supabaseAdmin
      .from('profiles')
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
      <AdminPageHeader
        titulo="Reivindicações pendentes"
        descricao={`${claimsComDados.length} solicitações aguardando análise`}
      />

      {claimsComDados.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Estabelecimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Solicitante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Responsável / CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Galeria (onboarding)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {claimsComDados.map((claim) => (
                <tr key={claim.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {claim.estabelecimentos?.nome || '—'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      /{claim.estabelecimentos?.slug || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">
                      {claim.usuarios?.nome || claim.usuarios?.email || '—'}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {claim.usuarios?.email || ''}
                    </div>
                    {claim.mensagem && (
                      <div className="mt-1 text-xs text-neutral-400">
                        💬 {claim.mensagem}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">{claim.nome_responsavel || '—'}</div>
                    <div className="font-mono text-xs text-neutral-500">
                      {claim.cpf_responsavel
                        ? claim.cpf_responsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {claim.telefone_contato && <div>📞 {claim.telefone_contato}</div>}
                    {claim.whatsapp_contato && <div>💬 {claim.whatsapp_contato}</div>}
                    {!claim.telefone_contato && !claim.whatsapp_contato && '—'}
                  </td>
                  <td className="px-6 py-4">
                    {claim.estabelecimentos?.galeria_fotos && claim.estabelecimentos.galeria_fotos.length > 0 ? (
                      <div className="flex gap-1">
                        {claim.estabelecimentos.galeria_fotos.slice(0, 4).map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Foto ${i + 1} da galeria de ${claim.estabelecimentos?.nome || 'estabelecimento'}`}
                              className="h-10 w-10 rounded border border-neutral-200 object-cover hover:opacity-80"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">Ainda não preencheu</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(claim.created_at).toLocaleDateString('pt-BR')}
                    <br />
                    <span className="text-xs text-neutral-400">
                      {new Date(claim.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <form action={async () => {
                        'use server'
                        await moderarClaim(claim.id, 'approve', claim.estabelecimento_id, claim.usuario_id)
                      }}>
                        <button
                          type="submit"
                          className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
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
                          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
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
        <div className="mt-6 rounded-2xl bg-white p-12 text-center text-neutral-500 shadow-sm">
          <div className="mb-4 text-6xl">✅</div>
          <p className="text-lg font-medium">Nenhuma reivindicação pendente</p>
          <p className="text-sm">Todas as solicitações foram analisadas.</p>
        </div>
      )}
    </div>
  )
}