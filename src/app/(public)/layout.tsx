import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import GlobalBreadcrumb from '@/components/GlobalBreadcrumb'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Paleta configurada pelo admin geral da plataforma (bg-orange-600 fixo
  // foi substituído por essas variáveis em todas as páginas públicas —
  // ver components/public e features/home).
  const supabase = await createClient()
  const { data: paleta } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'paleta_plataforma')
    .maybeSingle()

  const { data: { user } } = await supabase.auth.getUser()

  const corPrimaria = (paleta?.value as any)?.cor_primaria || '#EA580C'
  const corSecundaria = (paleta?.value as any)?.cor_secundaria || '#DC2626'

  return (
    <div
      className="flex min-h-screen flex-col bg-neutral-50"
      style={{ '--brand-primary': corPrimaria, '--brand-secondary': corSecundaria } as React.CSSProperties}
    >
      <PublicHeader logado={!!user} />
      <GlobalBreadcrumb />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
