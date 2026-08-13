import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NovoEstabelecimentoForm from './NovoEstabelecimentoForm'
import { checarPerfilCompleto } from '@/lib/perfilCompleto'

interface PageProps {
  searchParams: Promise<{ cnpj?: string }>
}

export default async function NovoEstabelecimentoPage({ searchParams }: PageProps) {
  const { cnpj } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const destinoAtual = cnpj ? `/estabelecimentos/novo?cnpj=${cnpj}` : '/estabelecimentos/novo'

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(destinoAtual)}`)
  }

  // Antes de deixar reivindicar ou cadastrar, o perfil precisa estar
  // completo (CPF, contato, data de nascimento com 18+) — assim o
  // resto desse fluxo nunca precisa pedir esses dados de novo.
  const statusPerfil = await checarPerfilCompleto(user.id)
  if (!statusPerfil.completo) {
    redirect(`/painel/perfil?motivo=completar&redirect=${encodeURIComponent(destinoAtual)}`)
  }

  const [{ data: profile }, { data: bairros }, { data: tiposEstabelecimento }] = await Promise.all([
    supabase.from('profiles').select('telefone, whatsapp').eq('id', user.id).maybeSingle(),
    supabase.from('bairros').select('id, nome, cidade_id').order('nome'),
    supabase.from('tipos_estabelecimento').select('id, slug, nome, icone').eq('ativo', true).order('ordem'),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-2">Cadastrar ou assumir um estabelecimento</h1>
        <p className="text-center text-gray-600 mb-8">
          Digite o CNPJ da empresa — se já estiver no diretório, você confirma que é sua; se não estiver, cadastramos do zero.
        </p>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <NovoEstabelecimentoForm
            userId={user.id}
            userNome={user.user_metadata?.full_name || ''}
            cnpjInicial={cnpj || ''}
            perfilTelefone={profile?.telefone || ''}
            perfilWhatsapp={profile?.whatsapp || ''}
            bairros={bairros || []}
            tiposEstabelecimento={tiposEstabelecimento || []}
          />
        </div>
      </div>
    </div>
  )
}
