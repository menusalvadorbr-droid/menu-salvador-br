import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validarCnpj, limparCnpj } from '@/lib/cnpj'
import { consultarCnpjCompleto } from '@/lib/brasilapi'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Só admin da plataforma acessa os dados estendidos (sócios, Simples
  // Nacional, etc.) — são informações mais sensíveis do que as usadas no
  // autocadastro do dono.
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const cnpjLimpo = limparCnpj(body?.cnpj || '')

  if (!validarCnpj(cnpjLimpo)) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
  }

  try {
    const dados = await consultarCnpjCompleto(cnpjLimpo)
    return NextResponse.json(dados)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao consultar CNPJ' }, { status: 502 })
  }
}
