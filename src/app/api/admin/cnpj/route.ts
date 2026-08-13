import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validarCnpj, limparCnpj } from '@/lib/cnpj'
import { consultarCnpjCompleto } from '@/lib/brasilapi'
import { resolverCidadeCobertura, encontrarBairroNaCidade, CidadeForaDeCoberturaError } from '@/lib/resolverCidadeCadastro'

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
    const cidade = await resolverCidadeCobertura(supabase, dados.cidade)
    const bairroId = await encontrarBairroNaCidade(supabase, dados.bairro, cidade.id)
    return NextResponse.json({ ...dados, cidadeId: cidade.id, cidadeNome: cidade.nome, bairroId })
  } catch (err: any) {
    if (err instanceof CidadeForaDeCoberturaError) {
      return NextResponse.json({ error: err.message, foraDeCobertura: true }, { status: 422 })
    }
    return NextResponse.json({ error: err.message || 'Erro ao consultar CNPJ' }, { status: 502 })
  }
}
