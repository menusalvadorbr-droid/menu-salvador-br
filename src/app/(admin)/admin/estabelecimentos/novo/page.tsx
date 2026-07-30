import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NovoEstabelecimentoAdminForm from './NovoEstabelecimentoAdminForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default async function NovoEstabelecimentoAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/admin')

  return (
    <div>
      <Link href="/admin/estabelecimentos" className="text-sm text-neutral-500 hover:text-orange-600">
        ← Voltar
      </Link>
      <div className="mt-1">
        <AdminPageHeader
          titulo="Adicionar estabelecimento ao diretório"
          descricao={
            <>
              Cadastra o estabelecimento sem dono — ele já aparece no diretório público e fica disponível pra
              alguém reivindicar em <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">/claim</code>.
              Os dados extras trazidos aqui (sócios, situação do Simples Nacional, tipo de logradouro) ajudam
              a validar quem reivindicar depois.
            </>
          }
        />
      </div>

      <div className="mt-6 max-w-2xl rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <NovoEstabelecimentoAdminForm />
      </div>
    </div>
  )
}
