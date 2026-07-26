import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

interface PageProps {
  searchParams: Promise<{ slug: string }>
}

/**
 * Essa tela (o formulário completo de reivindicar, pedindo nome/CPF/
 * telefone de novo) foi substituída pelo fluxo unificado em
 * /estabelecimentos/novo — digitar o CNPJ já reconhece o estabelecimento
 * existente e mostra a confirmação simplificada, sem pedir tudo de novo
 * pra quem já está logado. Esse arquivo agora só existe pra não quebrar
 * links antigos (salvos, indexados, etc.) que ainda apontam pra cá.
 */
export default async function ClaimPage({ searchParams }: PageProps) {
  const { slug } = await searchParams
  if (!slug) redirect('/')

  const supabase = await createClient()
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('cnpj')
    .eq('slug', slug)
    .maybeSingle()

  if (!est) notFound()

  redirect(`/estabelecimentos/novo?cnpj=${est.cnpj}`)
}