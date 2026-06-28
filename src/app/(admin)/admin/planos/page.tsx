import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  // Buscar planos existentes
  const { data: planos } = await supabase
    .from('planos')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">💰 Planos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos && planos.length > 0 ? (
          planos.map((plano) => (
            <div key={plano.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{plano.nome}</h2>
              <p className="text-sm text-gray-500 mt-1">{plano.descricao}</p>
              <p className="text-3xl font-bold text-orange-600 mt-4">
                R$ {plano.preco?.toFixed(2) || '0,00'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {plano.recursos?.length || 0} recursos incluídos
              </p>
              <div className="mt-4 flex gap-2">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">
                  Editar
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">
                  Remover
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <p className="text-lg">Nenhum plano cadastrado.</p>
            <button className="mt-4 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
              + Criar primeiro plano
            </button>
          </div>
        )}
      </div>
    </div>
  )
}