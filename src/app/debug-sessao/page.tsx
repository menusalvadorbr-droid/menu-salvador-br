import { createClient } from '@/lib/supabase/server'

// Página TEMPORÁRIA de diagnóstico — remova depois de resolver o problema
// do login do admin. Mostra exatamente o que o app enxerga da sua sessão
// e do seu profile, sem passar pelo middleware/redirecionamentos.
export default async function DebugSessaoPage() {
  const supabase = await createClient()
  const { data: { user }, error: erroUser } = await supabase.auth.getUser()

  let profile: any = null
  let erroProfile: any = null
  if (user) {
    const resultado = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = resultado.data
    erroProfile = resultado.error
  }

  return (
    <pre style={{ padding: 24, fontSize: 14, whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(
        {
          logado: Boolean(user),
          erro_ao_buscar_usuario: erroUser?.message || null,
          user_id: user?.id || null,
          user_email: user?.email || null,
          profile_encontrado: profile,
          erro_ao_buscar_profile: erroProfile?.message || null,
        },
        null,
        2
      )}
    </pre>
  )
}
