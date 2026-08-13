import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ListaEstabelecimentosAdmin from './ListaEstabelecimentosAdmin'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

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
    { count: excluidos },
    { data: estabelecimentos, count: totalFiltrado },
  ] = await Promise.all([
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'em_analise'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'excluido'),
    supabase
      .from('estabelecimentos')
      .select('*, bairros(slug), cidades(slug), tipos_estabelecimento(slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(inicio, fim),
  ])

  const totalPaginas = Math.max(1, Math.ceil((totalFiltrado || 0) / POR_PAGINA))

  return (
    <div>
      <div className="mb-6">
        <AdminPageHeader
          titulo="Estabelecimentos"
          descricao="Gerencie todos os estabelecimentos da plataforma"
          acoes={
            <Link
              href="/admin/estabelecimentos/novo"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
            >
              + Adicionar estabelecimento
            </Link>
          }
        />
      </div>

      {/* Estatísticas — sempre do total geral, não só da página atual */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-2xl font-bold text-gray-500">{excluidos || 0}</p>
          <p className="text-xs text-gray-500">Excluídos pelo dono</p>
        </div>
      </div>

      {/* Lista de estabelecimentos — card ou lista, igual ao painel do dono */}
      {estabelecimentos && estabelecimentos.length > 0 ? (
        <ListaEstabelecimentosAdmin estabelecimentos={estabelecimentos} />
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
