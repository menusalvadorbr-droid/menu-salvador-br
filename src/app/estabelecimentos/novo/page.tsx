import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoEstabelecimentoForm from './NovoEstabelecimentoForm'

export default async function NovoEstabelecimentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/estabelecimentos/novo')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Cadastrar estabelecimento</h1>
        <p className="text-center text-gray-600 mb-8">
          Preencha os dados do seu restaurante. Você poderá editar tudo depois.
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <NovoEstabelecimentoForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}
