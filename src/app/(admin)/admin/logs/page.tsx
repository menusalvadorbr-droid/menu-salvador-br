import { createClient } from '@/lib/supabase/server'
import { logSupabaseError } from '@/lib/supabase/logError'

const NIVEL_COR: Record<string, string> = {
  erro: 'bg-red-50 text-red-700',
  aviso: 'bg-amber-50 text-amber-700',
  info: 'bg-neutral-100 text-neutral-600',
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; nivel?: string }>
}) {
  const { tipo, nivel } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('logs_sistema')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (tipo) query = query.eq('tipo', tipo)
  if (nivel) query = query.eq('nivel', nivel)

  const { data: logs, error } = await query

  if (error) {
    logSupabaseError('Erro ao buscar logs', error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Logs</h1>
      <p className="mt-1 text-sm text-neutral-500">Erros técnicos e ações de auditoria dos últimos registros.</p>

      <div className="mt-4 flex gap-2">
        {['erro', 'auditoria'].map((t) => (
          <a
            key={t}
            href={`/admin/logs?tipo=${t}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tipo === t ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {t === 'erro' ? 'Erros' : 'Auditoria'}
          </a>
        ))}
        <a
          href="/admin/logs"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !tipo ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          Todos
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {error ? (
          <p className="p-8 text-center text-sm text-neutral-400">
            A tabela <code className="rounded bg-neutral-100 px-1">logs_sistema</code> ainda não existe no banco —
            crie-a para começar a registrar erros e ações de auditoria aqui.
          </p>
        ) : logs && logs.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-2">Quando</th>
                <th className="px-4 py-2">Nível</th>
                <th className="px-4 py-2">Mensagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-neutral-500">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${NIVEL_COR[log.nivel] || NIVEL_COR.info}`}>
                      {log.nivel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-700">{log.mensagem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-8 text-center text-sm text-neutral-400">Nenhum registro por enquanto.</p>
        )}
      </div>
    </div>
  )
}
