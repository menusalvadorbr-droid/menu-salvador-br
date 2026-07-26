import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validarCnpj, limparCnpj } from '@/lib/cnpj'
import { consultarCnpj } from '@/lib/brasilapi'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Exige login — mesmo a BrasilAPI sendo pública e gratuita, evita que
  // a rota vire um proxy aberto de consulta de CNPJ pra qualquer visitante.
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const cnpjLimpo = limparCnpj(body?.cnpj || '')

  if (!validarCnpj(cnpjLimpo)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const dados = await consultarCnpj(cnpjLimpo)
    return NextResponse.json(dados)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao consultar CNPJ' }, { status: 502 })
  }
}
