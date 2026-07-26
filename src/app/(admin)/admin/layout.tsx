import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const NAV_GERAL = [
  { href: '/admin', label: 'Visão geral', icone: '📊' },
  { href: '/admin/estabelecimentos', label: 'Estabelecimentos', icone: '🏪' },
  { href: '/admin/estabelecimentos/importar', label: 'Importar em lote', icone: '📥' },
  { href: '/admin/claims', label: 'Reivindicações', icone: '📋' },
  { href: '/admin/contestacoes', label: 'Contestações', icone: '⚖️' },
  { href: '/admin/planos', label: 'Planos', icone: '💰' },
  { href: '/admin/temas', label: 'Temas', icone: '🎨' },
  { href: '/admin/tipos', label: 'Tipos e bairros', icone: '🏷️' },
]

const NAV_PLATAFORMA = [
  { href: '/admin/configuracoes', label: 'Configurações', icone: '⚙️' },
  { href: '/admin/propagandas', label: 'Propaganda', icone: '📣' },
  { href: '/admin/logs', label: 'Logs', icone: '🗒️' },
  { href: '/admin/usuarios', label: 'Usuários', icone: '👥' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Checagem de acesso centralizada aqui (antes repetida em cada página do admin).
  // O middleware já bloqueia /admin para quem não é super_admin — isto é uma
  // segunda camada de segurança e também o ponto único que decide "quem sou eu"
  // pra exibir o nome na barra lateral.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-neutral-200 bg-white px-3 py-4">
        <Link href="/admin" className="flex items-center gap-2 px-2 pb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-sm">
            🍽️
          </span>
          <span className="text-sm font-semibold text-neutral-900">Admin geral</span>
        </Link>

        <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Geral
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV_GERAL.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>{item.icone}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="px-2 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Plataforma
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV_PLATAFORMA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition hover:bg-orange-50 hover:text-orange-700"
            >
              <span>{item.icone}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <Link href="/painel" className="block px-2 text-xs text-neutral-400 hover:text-neutral-600">
            ← Voltar ao painel
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
