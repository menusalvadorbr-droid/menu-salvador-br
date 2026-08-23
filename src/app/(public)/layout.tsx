import PublicHeader from '@/components/public/PublicHeader'
import PublicFooter from '@/components/public/PublicFooter'
import GlobalBreadcrumb from '@/components/GlobalBreadcrumb'
import { createPublicClient } from '@/lib/supabase/publicServer'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Paleta configurada pelo admin geral da plataforma (bg-orange-600 fixo
  // foi substituído por essas variáveis em todas as páginas públicas —
  // ver components/public e features/home).
  //
  // createPublicClient() (sem cookies) em vez do client de sessão — um
  // layout que lê cookies() força toda página por baixo dele pro modo
  // dinâmico, cancelando o ISR das páginas de diretório mesmo com
  // revalidate configurado nelas. O estado de login (antes lido aqui via
  // auth.getUser()) agora é checado no cliente, dentro do PublicHeader.
  const supabase = createPublicClient()
  const { data: paleta } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'paleta_plataforma')
    .maybeSingle()

  const corPrimaria = (paleta?.value as any)?.cor_primaria || '#EA580C'
  const corSecundaria = (paleta?.value as any)?.cor_secundaria || '#DC2626'

  return (
    <div
      className="flex min-h-screen flex-col bg-neutral-50"
      style={{ '--brand-primary': corPrimaria, '--brand-secondary': corSecundaria } as React.CSSProperties}
    >
      <PublicHeader />
      <GlobalBreadcrumb />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
