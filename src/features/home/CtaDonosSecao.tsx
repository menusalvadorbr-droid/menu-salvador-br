import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

/** Seção própria de rodapé pra donos de estabelecimento — antes só
 *  existia o BotaoFlutuante (pequeno, só mobile); isso dá mais destaque
 *  pro convite de cadastro em vez de depender só dele. */
export default async function CtaDonosSecao() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('ativo', true)

  return (
    <section
      className="mt-4 px-4 py-14 text-center text-white"
      style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
    >
      <div className="mx-auto max-w-xl">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Tem um bar ou restaurante?</h2>
        <p className="mt-3 text-sm text-white/90 md:text-base">
          Junte-se a mais de {count || 0} estabelecimentos com cardápio digital gratuito — sem
          mensalidade, sem aplicativo pro cliente baixar.
        </p>
        <Link
          href="/estabelecimentos/novo"
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg transition hover:scale-105"
        >
          Cadastrar meu estabelecimento →
        </Link>
      </div>
    </section>
  )
}
