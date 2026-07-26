import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

  const { data: reivindicacoes } = await supabase
    .from('restaurant_claims')
    .select('id, status, nome_responsavel, telefone_contato, whatsapp_contato, created_at')
    .eq('usuario_id', user.id)

  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('id, nome, nome_fantasia, slug, status, created_at')
    .eq('owner_user_id', user.id)

  const payload = {
    exportado_em: new Date().toISOString(),
    conta: { id: user.id, email: user.email, criado_em: user.created_at },
    perfil: profile,
    reivindicacoes,
    estabelecimentos,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="meus-dados-menu-salvador.json"',
    },
  })
}
