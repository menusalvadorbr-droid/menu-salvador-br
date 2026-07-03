import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

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

  const { count: errosRecentes } = await supabase
    .from('logs_sistema')
    .select('*', { count: 'exact', head: true })
    .eq('tipo', 'erro')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

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
          <p className="text-sm text-neutral-500">Erros nas últimas 24h</p>
          <p className={`text-3xl font-bold ${(errosRecentes ?? 0) > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
            {errosRecentes ?? 0}
          </p>
        </div>
      </div>

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
          <p className="mt-1 text-sm text-neutral-500">Erros e auditoria</p>
        </Link>
      </div>
    </div>
  )
}
