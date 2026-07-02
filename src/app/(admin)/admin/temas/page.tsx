import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GerenciarTemas } from '@/components/tema'

export default async function AdminTemasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  // Apenas super_admin pode acessar
  if (profile?.role !== 'super_admin') redirect('/painel')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <GerenciarTemas />
      </div>
    </div>
  )
}