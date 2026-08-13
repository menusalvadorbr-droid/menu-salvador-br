import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validarCnpj, limparCnpj } from '@/lib/cnpj'
import { consultarCnpj } from '@/lib/brasilapi'
import { resolverCidadeCobertura, encontrarBairroNaCidade, CidadeForaDeCoberturaError } from '@/lib/resolverCidadeCadastro'

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

    // Cidade fora da cobertura interrompe aqui — antes do dono preencher
    // o resto do formulário, não só no bairro (ver src/lib/
    // resolverCidadeCadastro.ts: sem find-or-create, é lista curada).
    const cidade = await resolverCidadeCobertura(supabase, dados.cidade)
    const bairroId = await encontrarBairroNaCidade(supabase, dados.bairro, cidade.id)

    return NextResponse.json({ dados, cidadeId: cidade.id, cidadeNome: cidade.nome, bairroId })
  } catch (err: any) {
    if (err instanceof CidadeForaDeCoberturaError) {
      return NextResponse.json({ error: err.message, foraDeCobertura: true }, { status: 422 })
    }
    return NextResponse.json({ error: err.message || 'Erro ao consultar CNPJ' }, { status: 502 })
  }
}
