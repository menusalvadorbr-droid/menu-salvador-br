import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminEstabelecimentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">🏪 Estabelecimentos</h1>
      <p className="text-gray-500 mb-6">{estabelecimentos?.length || 0} estabelecimentos cadastrados</p>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {estabelecimentos?.map((est) => (
              <tr key={est.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{est.nome}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    est.status === 'active' ? 'bg-green-100 text-green-700' :
                    est.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {est.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {est.owner_user_id ? '✓ Vinculado' : 'Sem dono'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:underline mr-3">Editar</button>
                  <button className="text-green-600 hover:underline mr-3">Aprovar</button>
                  <button className="text-red-600 hover:underline">Bloquear</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}