import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { handleLogout } from './painel/actions'
import MenuAvatar from './painel/components/MenuAvatar'

const COR_TERRACOTA = '#C1541F'
const COR_TEXTO = '#2A2420'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Cabeçalho — identidade e conta, igual em toda a área logada.
          O que muda por página (título, ações específicas, "voltar
          pra") continua em cada página; isso aqui é só o que nunca
          muda: logo e acesso à conta. */}
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-3 md:px-8">
        <Link href="/painel" className="text-sm font-bold tracking-tight" style={{ color: COR_TEXTO }}>
          menu<span style={{ color: COR_TERRACOTA }}>.salvador</span>
        </Link>
        {user && <MenuAvatar onLogout={handleLogout} />}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-black/5 bg-white px-6 py-4 text-center text-xs text-neutral-400 md:px-8">
        <p>
          menu.salvador — painel do estabelecimento ·{' '}
          <Link href="/" className="hover:text-neutral-600 hover:underline">
            Ver diretório público ↗
          </Link>
        </p>
      </footer>
    </div>
  )
}
