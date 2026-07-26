import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/logError'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string }>
}) {
  const { acao } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (acao) query = query.ilike('action', `%${acao}%`)

  const { data: logs, error } = await query

  if (error) {
    logSupabaseError('Erro ao buscar audit_logs', error)
  }

  // Busca os nomes dos usuários responsáveis pelas ações (join manual)
  const usuarioIds = [...new Set((logs || []).map((l) => l.usuario_id).filter(Boolean))]
  const usuariosPorId: Record<string, string> = {}
  if (usuarioIds.length > 0) {
    const { data: perfis } = await supabase.from('profiles').select('id, nome, email').in('id', usuarioIds)
    perfis?.forEach((p) => {
      usuariosPorId[p.id] = p.nome || p.email || p.id
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Logs de auditoria</h1>
      <p className="mt-1 text-sm text-neutral-500">Ações administrativas registradas na plataforma.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {error ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            Não foi possível carregar os logs: {error.message}
          </p>
        ) : logs && logs.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Quem</th>
                <th className="px-4 py-2">Ação</th>
                <th className="px-4 py-2">Alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-neutral-500">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-neutral-700">
                    {log.usuario_id ? usuariosPorId[log.usuario_id] || '—' : 'Sistema'}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-neutral-400">
                    {log.target_type ? `${log.target_type} · ${log.target_id?.slice(0, 8) ?? ''}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-8 text-center text-sm text-neutral-400">Nenhum registro de auditoria ainda.</p>
        )}
      </div>
    </div>
  )
}
