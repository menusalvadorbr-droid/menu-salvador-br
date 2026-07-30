import { createClient } from '@/lib/supabase/server'
import TabelaUsuarios from './TabelaUsuarios'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('id, nome, email, role')
    .order('nome', { ascending: true })

  return (
    <div>
      <AdminPageHeader titulo="Usuários" descricao="Gerencie quem tem acesso de super admin, dono ou gerente." />
      <div className="mt-6">
        <TabelaUsuarios usuarios={usuarios || []} meuId={user?.id || ''} />
      </div>
    </div>
  )
}
