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
    .from('estabelecimentos_publico')
    .select('slug, cnpj')
    .eq('slug', slug)
    .maybeSingle()

  if (!est) notFound()

  // cnpj só vem preenchido pra estabelecimento sem dono (ver view
  // estabelecimentos_publico) — se já foi reivindicado, não faz sentido
  // mandar pro formulário de reivindicação; manda pro cardápio, que já
  // existe de verdade.
  if (!est.cnpj) redirect(`/cardapio/${est.slug}`)

  redirect(`/estabelecimentos/novo?cnpj=${est.cnpj}`)
}