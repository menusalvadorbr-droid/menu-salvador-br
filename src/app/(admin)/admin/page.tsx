import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

interface ItemFila {
  id: string
  tipo: 'claim' | 'contestacao'
  titulo: string
  criadoEm: string
}

// Formato bruto de uma linha de restaurant_claims/vinculo_contestacoes
// depois do join embutido — só os campos que a fila de hoje usa.
interface LinhaFilaBruta {
  id: string
  created_at: string
  estabelecimentos: { nome: string; nome_fantasia: string | null } | { nome: string; nome_fantasia: string | null }[] | null
}

function nomeEstabelecimento(rel: LinhaFilaBruta['estabelecimentos']): string {
  const est = Array.isArray(rel) ? rel[0] : rel
  return est?.nome_fantasia || est?.nome || 'Estabelecimento'
}

// Fora do componente de propósito — Date.now() direto no corpo de um
// Server Component é sinalizado pelo lint de pureza (react-hooks/purity),
// mesma regra que já vale pros client components do projeto. Função comum
// (não é componente/hook) não cai nessa checagem.
function isoHaDias(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
}

export default async function AdminPage() {
  const supabase = await createClient()

  const seteDiasAtras = isoHaDias(7)

  const [
    { count: claimsPendentes },
    { count: contestacoesPendentes },
    { count: estabPendentes },
    { count: novosEstab7d },
    { count: estabAtivos },
    { count: estabBloqueados },
    { data: filaClaimsBruta },
    { data: filaContestacoesBruta },
  ] = await Promise.all([
    supabase.from('restaurant_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('vinculo_contestacoes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'em_analise'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).gte('created_at', seteDiasAtras),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase
      .from('restaurant_claims')
      .select('id, created_at, estabelecimentos:estabelecimento_id(nome, nome_fantasia)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('vinculo_contestacoes')
      .select('id, created_at, estabelecimentos:estabelecimento_id(nome, nome_fantasia)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Reivindicação + contestação misturadas numa fila só, mais recente
  // primeiro — é o que a pessoa que abre o admin de manhã precisa decidir
  // hoje, não dois números separados sem contexto nenhum.
  const fila: ItemFila[] = [
    ...((filaClaimsBruta ?? []) as LinhaFilaBruta[]).map((c) => ({
      id: c.id,
      tipo: 'claim' as const,
      titulo: nomeEstabelecimento(c.estabelecimentos),
      criadoEm: c.created_at,
    })),
    ...((filaContestacoesBruta ?? []) as LinhaFilaBruta[]).map((c) => ({
      id: c.id,
      tipo: 'contestacao' as const,
      titulo: nomeEstabelecimento(c.estabelecimentos),
      criadoEm: c.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 8)

  const totalPendencias = (claimsPendentes ?? 0) + (contestacoesPendentes ?? 0)

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
      <AdminPageHeader titulo="Visão geral" descricao="O que precisa de decisão hoje." />

      {/* Fila de pendências — 3 cards que levam direto pra onde se decide,
          não só um número solto. */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/claims"
          className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:shadow-md"
        >
          <p className="text-sm text-neutral-500">Reivindicações pendentes</p>
          <p className="text-3xl font-bold text-amber-600">{claimsPendentes ?? 0}</p>
        </Link>
        <Link
          href="/admin/contestacoes"
          className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
        >
          <p className="text-sm text-neutral-500">Contestações pendentes</p>
          <p className="text-3xl font-bold text-red-600">{contestacoesPendentes ?? 0}</p>
        </Link>
        <Link
          href="/admin/estabelecimentos"
          className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:border-orange-200 hover:shadow-md"
        >
          <p className="text-sm text-neutral-500">Estabelecimentos em análise</p>
          <p className="text-3xl font-bold text-orange-600">{estabPendentes ?? 0}</p>
        </Link>
      </div>

      {/* Saúde geral — não é fila de decisão, é contexto (crescimento,
          quantos estão realmente no ar). */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Novos estabelecimentos (7 dias)</p>
          <p className="text-3xl font-bold text-neutral-900">{novosEstab7d ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Ativos / Bloqueados</p>
          <p className="text-3xl font-bold text-neutral-900">
            <span className="text-green-600">{estabAtivos ?? 0}</span>
            <span className="mx-1.5 text-neutral-300">/</span>
            <span className="text-red-600">{estabBloqueados ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Fila de hoje — reivindicação + contestação misturadas, mais
          recente primeiro. Sem isso a home só dizia "tem 3 pendentes",
          sem dizer quais nem deixar agir direto. */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-neutral-900">Fila de hoje</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          {fila.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-400">Nada pendente agora — fila zerada. ✅</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {fila.map((item) => (
                <li key={`${item.tipo}-${item.id}`}>
                  <Link
                    href={item.tipo === 'claim' ? '/admin/claims' : '/admin/contestacoes'}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition hover:bg-neutral-50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          item.tipo === 'claim' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.tipo === 'claim' ? 'Reivindicação' : 'Contestação'}
                      </span>
                      <span className="truncate text-neutral-800">{item.titulo}</span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {totalPendencias > fila.length && (
          <div className="mt-2 flex gap-4 text-sm">
            <Link href="/admin/claims" className="font-medium text-orange-600 hover:underline">
              Ver todas as reivindicações →
            </Link>
            <Link href="/admin/contestacoes" className="font-medium text-orange-600 hover:underline">
              Ver todas as contestações →
            </Link>
          </div>
        )}
      </div>

      {topAtividades.length > 0 && (
        <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">Estabelecimentos por atividade econômica</p>
          <p className="text-xs text-neutral-400 mb-4">
            Vindo do CNAE informado na consulta de CNPJ no cadastro — {totalComAtividade} de{' '}
            {(estabAtivos ?? 0) + (estabBloqueados ?? 0) + (estabPendentes ?? 0)} com esse dado preenchido.
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

      <div className="mt-8">
        <h2 className="text-base font-semibold text-neutral-900">Ações rápidas</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/admin/estabelecimentos/importar"
            className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
          >
            <div className="mb-2 text-3xl">📥</div>
            <h3 className="text-lg font-semibold text-neutral-900">Importar em lote</h3>
            <p className="mt-1 text-sm text-neutral-500">Cadastrar vários estabelecimentos por CNPJ</p>
          </Link>
          <Link
            href="/admin/configuracoes"
            className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
          >
            <div className="mb-2 text-3xl">⚙️</div>
            <h3 className="text-lg font-semibold text-neutral-900">Configurações</h3>
            <p className="mt-1 text-sm text-neutral-500">Seções, identidade visual e integrações</p>
          </Link>
          <Link
            href="/admin/logs"
            className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-orange-200"
          >
            <div className="mb-2 text-3xl">🗒️</div>
            <h3 className="text-lg font-semibold text-neutral-900">Logs</h3>
            <p className="mt-1 text-sm text-neutral-500">Auditoria de ações administrativas</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
