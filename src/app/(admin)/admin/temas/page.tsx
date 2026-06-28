import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TemasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/painel')

  const { data: temas } = await supabase
    .from('temas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">🎨 Temas</h1>
      <p className="text-gray-500 mb-6">{temas?.length || 0} temas disponíveis</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {temas?.map((tema) => (
          <div key={tema.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-bold text-lg">{tema.nome}</h3>
            <p className="text-sm text-gray-500">{tema.descricao}</p>
            <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
              tema.tipo === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100'
            }`}>
              {tema.tipo === 'premium' ? '🔒 Premium' : 'Grátis'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}