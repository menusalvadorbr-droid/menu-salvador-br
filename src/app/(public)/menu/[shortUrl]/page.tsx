import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

interface MenuDigitalPageProps {
  params: Promise<{ shortUrl: string }>
}

/**
 * Rota curta usada pelos QR Codes impressos nas mesas.
 * Antes mostrava uma página de "em construção" mesmo quando o
 * estabelecimento já tinha um cardápio completo em /cardapio/[slug].
 * Agora redireciona direto para o cardápio real.
 */
export default async function MenuDigitalPage({ params }: MenuDigitalPageProps) {
  const supabase = await createClient()
  const { shortUrl } = await params

  const { data: estabelecimento, error } = await supabase
    .from('estabelecimentos')
    .select('slug')
    .eq('qrcode_short_url', shortUrl)
    .eq('status', 'active')
    .eq('ativo', true)
    .single()

  if (error || !estabelecimento) {
    notFound()
  }

  redirect(`/cardapio/${estabelecimento.slug}`)
}
