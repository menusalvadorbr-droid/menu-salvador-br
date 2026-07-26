import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { count: totalEstabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsuarios } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: claimsPendentes } = await supabase
    .from('restaurant_claims')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: acoesRecentes } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  // Distribuição por atividade econômica (CNAE) — vem do cadastro via
  // consulta de CNPJ. O client do Supabase não faz GROUP BY nativo,
  // então busca os valores e agrupa aqui mesmo; a base de estabelecimentos
  // de um diretório regional é pequena o suficiente pra isso ser barato.
  const { data: atividades } = await supabase
    .from('estabelecimentos')
    .select('atividade_economica')
    .not('atividade_economica', 'is', null)

  const contagemPorAtividade = new Map<string, number>()
  for (const { atividade_economica } of atividades || []) {
    if (!atividade_economica) continue
    contagemPorAtividade.set(atividade_economica, (contagemPorAtividade.get(atividade_economica) || 0) + 1)
  }
  const topAtividades = [...contagemPorAtividade.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const totalComAtividade = atividades?.length || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Visão geral</h1>
      <p className="mt-1 text-sm text-neutral-500">Resumo rápido da plataforma.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Estabelecimentos</p>
          <p className="text-3xl font-bold text-neutral-900">{totalEstabelecimentos ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Usuários</p>
          <p className="text-3xl font-bold text-neutral-900">{totalUsuarios ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Reivindicações pendentes</p>
          <p className="text-3xl font-bold text-amber-600">{claimsPendentes ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Ações administrativas (24h)</p>
          <p className="text-3xl font-bold text-neutral-900">
            {acoesRecentes ?? 0}
          </p>
        </div>
      </div>

      {topAtividades.length > 0 && (
        <div className="mt-6 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Estabelecimentos por atividade econômica</p>
          <p className="text-xs text-neutral-400 mb-4">
            Vindo do CNAE informado na consulta de CNPJ no cadastro — {totalComAtividade} de {totalEstabelecimentos ?? 0} com esse dado preenchido.
          </p>
          <div className="space-y-2">
            {topAtividades.map(([atividade, contagem]) => {
              const percentual = totalComAtividade > 0 ? Math.round((contagem / totalComAtividade) * 100) : 0
              return (
                <div key={atividade} className="flex items-center gap-3 text-sm">
                  <span className="w-1/2 truncate text-neutral-700" title={atividade}>{atividade}</span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-orange-500" style={{ width: `${percentual}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right text-neutral-500">{contagem} ({percentual}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/estabelecimentos"
          className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
        >
          <div className="mb-2 text-3xl">🏪</div>
          <h2 className="text-lg font-semibold text-neutral-900">Estabelecimentos</h2>
          <p className="mt-1 text-sm text-neutral-500">Aprovar, bloquear e moderar</p>
        </Link>
        <Link
          href="/admin/claims"
          className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
        >
          <div className="mb-2 text-3xl">📋</div>
          <h2 className="text-lg font-semibold text-neutral-900">Reivindicações</h2>
          <p className="mt-1 text-sm text-neutral-500">Solicitações de donos</p>
        </Link>
        <Link
          href="/admin/configuracoes"
          className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
        >
          <div className="mb-2 text-3xl">⚙️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Configurações da plataforma</h2>
          <p className="mt-1 text-sm text-neutral-500">Seções e identidade visual</p>
        </Link>
        <Link
          href="/admin/logs"
          className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
        >
          <div className="mb-2 text-3xl">🗒️</div>
          <h2 className="text-lg font-semibold text-neutral-900">Logs</h2>
          <p className="mt-1 text-sm text-neutral-500">Auditoria de ações administrativas</p>
        </Link>
      </div>
    </div>
  )
}
