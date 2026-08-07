import { createClient } from '@/lib/supabase/server'
import { dataEmSalvador } from '@/lib/horarioSalvador'
import Hero from './Hero'
import BuscaHome from './BuscaHome'

/**
 * Primeira seção a carregar (ver ordem em [[...slug]]/page.tsx) — só as
 * duas contagens rápidas que o banner precisa, independente do resto da
 * home. "Hoje" é sempre o dia de Salvador, não o fuso de onde o servidor
 * roda (mesma classe de bug já corrigida em statusAberto.ts/specialOffers.ts).
 */
export default async function HeroSecao({
  buscaAtivado,
  qInicial,
  bairroAtual,
  tipoAtual,
}: {
  buscaAtivado: boolean
  qInicial?: string
  bairroAtual?: string
  tipoAtual?: string
}) {
  const supabase = await createClient()
  const inicioDoDiaSalvador = dataEmSalvador(new Date(), 0, 0)

  const [{ count: totalEstabs }, { count: scansHoje }] = await Promise.all([
    supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('ativo', true),
    supabase.from('scans_qrcode').select('*', { count: 'exact', head: true }).gte('scanned_at', inicioDoDiaSalvador.toISOString()),
  ])

  return (
    <Hero totalScans={scansHoje || 0} totalEstabs={totalEstabs || 0}>
      {buscaAtivado && <BuscaHome qInicial={qInicial} bairroAtual={bairroAtual} tipoAtual={tipoAtual} />}
    </Hero>
  )
}
