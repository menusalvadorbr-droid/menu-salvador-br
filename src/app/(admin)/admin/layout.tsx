import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Checagem de acesso centralizada aqui (antes repetida em cada página do admin).
  // O middleware já bloqueia /admin para quem não é super_admin — isto é uma
  // segunda camada de segurança e também o ponto único que decide "quem sou eu"
  // pra exibir o nome na barra lateral.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 md:flex-row">
      <AdminNav nomeAdmin={profile?.nome || user.email || 'Admin'} />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
