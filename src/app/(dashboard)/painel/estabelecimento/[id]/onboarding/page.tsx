import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OnboardingPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/painel/estabelecimento/${id}/onboarding`)

  const { data: estabelecimento } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!estabelecimento) notFound()

  // Só o dono provisório (quem abriu a reivindicação) acessa o onboarding.
  if (estabelecimento.owner_user_id !== user.id) {
    redirect('/painel')
  }

  // Se já foi aprovado (ou nunca passou por reivindicação), o onboarding
  // não faz mais sentido — manda direto pro painel de gestão completo.
  if (estabelecimento.status !== 'em_analise') {
    redirect(`/painel/estabelecimento/${id}/gerenciar`)
  }

  return <OnboardingWizard estabelecimento={estabelecimento} userId={user.id} />
}
