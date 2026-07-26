import { createClient } from '@/lib/supabase/server'
import TabelaUsuarios from './TabelaUsuarios'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .order('nome', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Usuários</h1>
      <p className="mt-1 text-sm text-neutral-500">Gerencie quem tem acesso de super admin, dono ou gerente.</p>
      <div className="mt-6">
        <TabelaUsuarios usuarios={usuarios || []} meuId={user?.id || ''} />
      </div>
    </div>
  )
}
