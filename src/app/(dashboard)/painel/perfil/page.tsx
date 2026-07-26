import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PerfilForm from './PerfilForm'
import SegurancaForm from './SegurancaForm'
import PrivacidadeDados from './PrivacidadeDados'
import { checarPerfilCompleto } from '@/lib/perfilCompleto'

const COR_TERRACOTA = '#C1541F'
const COR_FUNDO = '#FBF7F0'
const COR_TEXTO = '#2A2420'

interface PageProps {
  searchParams: Promise<{ motivo?: string; redirect?: string }>
}

function redirectSeguro(valor: string | undefined): string {
  if (!valor) return '/painel'
  if (!valor.startsWith('/') || valor.startsWith('//')) return '/painel'
  return valor
}

export default async function PerfilPage({ searchParams }: PageProps) {
  const { motivo, redirect: redirectParam } = await searchParams
  const destinoVolta = redirectSeguro(redirectParam)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent('/painel/perfil')}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf, telefone, whatsapp, data_nascimento')
    .eq('id', user.id)
    .maybeSingle()

  const status = await checarPerfilCompleto(user.id)

  return (
    <div className="min-h-screen" style={{ backgroundColor: COR_FUNDO }}>
      <div className="mx-auto max-w-lg px-6 py-10 md:px-8">
        <Link href="/painel" className="text-sm opacity-60 hover:opacity-100" style={{ color: COR_TEXTO }}>
          ← Voltar ao painel
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: COR_TEXTO }}>
          Meu perfil
        </h1>

        {motivo === 'completar' && !status.completo && (
          <div
            className="mt-4 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: `${COR_TERRACOTA}40`, backgroundColor: `${COR_TERRACOTA}0d`, color: COR_TEXTO }}
          >
            <p className="font-medium">Falta completar seu perfil pra continuar.</p>
            <p className="mt-1 opacity-80">
              CPF, um contato e data de nascimento confirmam quem você é — necessário antes de reivindicar ou
              cadastrar um estabelecimento. Depois de salvar, você volta pra onde estava.
            </p>
          </div>
        )}

        <div
          className="mt-6 rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: `${COR_TEXTO}0f`, backgroundColor: '#FFFFFF' }}
        >
          <PerfilForm
            nomeInicial={user.user_metadata?.full_name || ''}
            email={user.email || ''}
            cpfInicial={profile?.cpf || ''}
            telefoneInicial={profile?.telefone || ''}
            whatsappInicial={profile?.whatsapp || ''}
            dataNascimentoInicial={profile?.data_nascimento || ''}
            redirectAposSalvar={motivo === 'completar' ? destinoVolta : null}
          />
        </div>

        <div
          className="mt-4 rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: `${COR_TEXTO}0f`, backgroundColor: '#FFFFFF' }}
        >
          <SegurancaForm />
        </div>

        <div className="mt-4">
          <PrivacidadeDados email={user.email || ''} />
        </div>
      </div>
    </div>
  )
}
