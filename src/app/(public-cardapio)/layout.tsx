import PublicFooter from '@/components/public/PublicFooter'
import GlobalBreadcrumb from '@/components/GlobalBreadcrumb'
import { createPublicClient } from '@/lib/supabase/publicServer'

/**
 * Layout do cardápio público (/cardapio/[slug] e .../categoria/[categoriaId])
 * — mesma casca do grupo (public), mas sem o PublicHeader: o cardápio fica
 * focado só no conteúdo do estabelecimento, sem a barra do site por cima.
 * Grupo de rotas separado (em vez de esconder o header condicionalmente
 * dentro do layout de (public)) porque layouts de Server Component não têm
 * como saber a rota atual sem gambiarra — mover a árvore de arquivos pra um
 * grupo irmão é o jeito suportado pelo App Router, e não muda nenhuma URL
 * (parênteses no nome da pasta não entram no path).
 */
export default async function PublicCardapioLayout({ children }: { children: React.ReactNode }) {
  // Mesma paleta da plataforma que (public)/layout.tsx usa — PublicFooter
  // depende das variáveis --brand-primary/--brand-secondary pra se estilizar.
  // createPublicClient() (sem cookies) pelo mesmo motivo do outro layout —
  // ver comentário lá.
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
      <GlobalBreadcrumb />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
