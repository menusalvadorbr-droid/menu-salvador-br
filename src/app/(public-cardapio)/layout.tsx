import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/publicServer'

/**
 * Layout do cardápio público (/cardapio/[slug], .../categoria/[categoriaId],
 * .../pedido/[pedidoId], .../pedidos — e os equivalentes de /cardapio-v2)
 * — mesma casca do grupo (public), mas sem o PublicHeader nem a trilha/
 * rodapé do site: quem chega aqui escaneou um QR na mesa ou entrou por um
 * link direto, quer ver o cardápio (ou acompanhar o pedido), não navegar
 * pelo diretório. Só uma marca discreta no rodapé, não o rodapé inteiro
 * (que teria links de cadastro/termos/etc. fora de contexto aqui). Grupo de
 * rotas separado (em vez de esconder condicionalmente dentro do layout de
 * (public)) porque layouts de Server Component não têm como saber a rota
 * atual sem gambiarra — mover a árvore de arquivos pra um grupo irmão é o
 * jeito suportado pelo App Router, e não muda nenhuma URL (parênteses no
 * nome da pasta não entram no path).
 */
export default async function PublicCardapioLayout({ children }: { children: React.ReactNode }) {
  // Mesma paleta da plataforma que (public)/layout.tsx usa — o crédito no
  // rodapé usa a cor de marca no hover. createPublicClient() (sem cookies)
  // pelo mesmo motivo do outro layout — ver comentário lá.
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
      <main className="flex-1">{children}</main>
      <p className="py-3 text-center text-[11px] text-neutral-400">
        Powered by{' '}
        <Link href="/" className="hover:text-[var(--brand-primary)]">
          menu.salvador
        </Link>
      </p>
    </div>
  )
}
