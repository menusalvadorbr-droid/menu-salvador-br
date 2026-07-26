import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AcoesEstabelecimentoAdmin } from './AcoesEstabelecimentoAdmin'

const POR_PAGINA = 24

interface PageProps {
  searchParams: Promise<{ pagina?: string }>
}

export default async function AdminEstabelecimentosPage({ searchParams }: PageProps) {
  const { pagina: paginaParam } = await searchParams
  const pagina = Math.max(1, parseInt(paginaParam || '1', 10) || 1)
  const inicio = (pagina - 1) * POR_PAGINA
  const fim = inicio + POR_PAGINA - 1

  const supabase = await createClient()

  // Contagens vêm de consultas próprias (head: true, só conta, não traz
  // linha nenhuma) — precisam ser separadas da lista paginada, senão os
  // números do topo mostrariam só o total da página atual, não do total
  // geral.
  const [
    { count: total },
    { count: ativos },
    { count: pendentes },
    { count: bloqueados },
    { data: estabelecimentos, count: totalFiltrado },
  ] = await Promise.all([
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'em_analise'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase
      .from('estabelecimentos')
      .select('*, bairros(slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(inicio, fim),
  ])

  const totalPaginas = Math.max(1, Math.ceil((totalFiltrado || 0) / POR_PAGINA))

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      active: { label: '✅ Ativo', bg: 'bg-green-50', text: 'text-green-700' },
      em_analise: { label: '🕒 Em análise', bg: 'bg-amber-50', text: 'text-amber-700' },
      blocked: { label: '🚫 Bloqueado', bg: 'bg-red-50', text: 'text-red-700' },
    }
    return map[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
          <p className="text-sm text-gray-500">Gerencie todos os estabelecimentos da plataforma</p>
        </div>
        <Link
          href="/admin/estabelecimentos/novo"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Adicionar estabelecimento
        </Link>
      </div>

      {/* Estatísticas — sempre do total geral, não só da página atual */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-800">{total || 0}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-green-600">{ativos || 0}</p>
          <p className="text-xs text-gray-500">Ativos</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-yellow-600">{pendentes || 0}</p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-red-600">{bloqueados || 0}</p>
          <p className="text-xs text-gray-500">Bloqueados</p>
        </div>
      </div>

      {/* Lista de cards */}
      {estabelecimentos && estabelecimentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {estabelecimentos.map((est) => {
            const badge = getStatusBadge(est.status)
            const isPending = est.status === 'em_analise' // corrigido: era 'pending_review', valor morto que nunca batia
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
                  <AcoesEstabelecimentoAdmin
                    estabelecimentoId={est.id}
                    nomeExibicao={est.nome_fantasia || est.nome}
                    isPending={isPending}
                    isBlocked={isBlocked}
                    temDono={!!est.owner_user_id}
                  />

                  {/* Ver público */}
                  <Link
                    href={
                      est.cidade && est.bairros?.slug && est.tipo_estabelecimento
                        ? `/${est.cidade}/${est.bairros.slug}/${est.tipo_estabelecimento}/${est.slug}`
                        : `/cardapio/${est.slug}`
                    }
                    target="_blank"
                    className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    👁️ Ver
                  </Link>

                  <Link
                    href={`/admin/estabelecimentos/${est.id}/analisar`}
                    className="inline-flex items-center gap-1 bg-neutral-700 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    🔍 Analisar
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

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Link
            href={`?pagina=${Math.max(1, pagina - 1)}`}
            aria-disabled={pagina <= 1}
            className={`rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition ${
              pagina <= 1 ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← Anterior
          </Link>
          <span className="text-sm text-gray-500">
            Página {pagina} de {totalPaginas}
          </span>
          <Link
            href={`?pagina=${Math.min(totalPaginas, pagina + 1)}`}
            aria-disabled={pagina >= totalPaginas}
            className={`rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium transition ${
              pagina >= totalPaginas ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Próxima →
          </Link>
        </div>
      )}
    </div>
  )
}
