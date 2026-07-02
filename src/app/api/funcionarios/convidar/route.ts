import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const CARGOS_VALIDOS = ['gerente', 'caixa', 'garcom', 'cozinha'] as const
type Cargo = (typeof CARGOS_VALIDOS)[number]

/**
 * POST /api/funcionarios/convidar
 *
 * Cria (ou reaproveita) uma conta de autenticação real para o funcionário
 * e o vincula ao estabelecimento na tabela `funcionarios`.
 *
 * Por que essa rota precisa existir:
 * Antes, o convite só inserisse uma linha na tabela `usuarios` sem nunca
 * criar a credencial em auth.users — o funcionário nunca conseguia logar.
 * Criar usuários no Supabase Auth exige a service role key, que NUNCA pode
 * ficar exposta no client. Por isso isso roda só aqui, no servidor.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { estabelecimentoId, email, nome, cargo } = body as {
      estabelecimentoId?: string
      email?: string
      nome?: string
      cargo?: Cargo
    }

    if (!estabelecimentoId || !email || !nome || !cargo) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
    }

    if (!CARGOS_VALIDOS.includes(cargo)) {
      return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
    }

    // 1. Quem está fazendo o convite precisa estar autenticado e ser
    //    dono/gerente do estabelecimento (ou super_admin).
    const supabase = await createClient()
    const { data: { user: solicitante } } = await supabase.auth.getUser()

    if (!solicitante) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: estabelecimento } = await supabase
      .from('estabelecimentos')
      .select('id, owner_user_id, nome')
      .eq('id', estabelecimentoId)
      .single()

    if (!estabelecimento) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado.' }, { status: 404 })
    }

    const { data: perfilSolicitante } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', solicitante.id)
      .single()

    const ehDono = estabelecimento.owner_user_id === solicitante.id
    const ehSuperAdmin = perfilSolicitante?.role === 'super_admin'

    // Gerente também pode convidar — checamos se o solicitante é funcionário
    // com cargo 'gerente' nesse estabelecimento.
    let ehGerente = false
    if (!ehDono && !ehSuperAdmin) {
      const { data: vinculoGerente } = await supabase
        .from('funcionarios')
        .select('cargo')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('user_id', solicitante.id)
        .eq('ativo', true)
        .maybeSingle()
      ehGerente = vinculoGerente?.cargo === 'gerente'
    }

    if (!ehDono && !ehSuperAdmin && !ehGerente) {
      return NextResponse.json({ error: 'Sem permissão para convidar funcionários.' }, { status: 403 })
    }

    // 2. Verificar se já existe um usuário com esse e-mail no Auth.
    //    listUsers não filtra por e-mail diretamente, então paginamos
    //    com um filtro razoável (funciona bem para bases pequenas/médias;
    //    para escala maior, prefira a tabela 'usuarios' como índice).
    const { data: existingByTable } = await supabaseAdmin
      .from('usuarios')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    let userId = existingByTable?.id as string | undefined

    if (!userId) {
      // 3. Criar o usuário de verdade no Supabase Auth, sem senha definida.
      //    O Supabase envia automaticamente um e-mail de convite (usa o SMTP
      //    configurado no projeto — você pode apontar para o Resend nas
      //    configurações de Auth > SMTP do Supabase).
      const { data: novoAuthUser, error: createAuthError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: nome },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/definir-senha`,
        })

      if (createAuthError || !novoAuthUser?.user) {
        return NextResponse.json(
          { error: createAuthError?.message || 'Erro ao criar usuário.' },
          { status: 500 }
        )
      }

      userId = novoAuthUser.user.id

      // 4. Espelhar o usuário na tabela 'usuarios' (perfil da aplicação).
      const { error: insertUsuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
          id: userId,
          email,
          nome,
          role: 'funcionario',
        })

      if (insertUsuarioError) {
        return NextResponse.json({ error: insertUsuarioError.message }, { status: 500 })
      }
    }

    // 5. Vincular ao estabelecimento como funcionário com o cargo escolhido.
    //    upsert evita duplicar caso o convite seja reenviado.
    const { error: vinculoError } = await supabaseAdmin
      .from('funcionarios')
      .upsert(
        {
          estabelecimento_id: estabelecimentoId,
          user_id: userId,
          cargo,
          ativo: true,
        },
        { onConflict: 'estabelecimento_id,user_id' }
      )

    if (vinculoError) {
      return NextResponse.json({ error: vinculoError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: any) {
    console.error('Erro ao convidar funcionário:', err)
    return NextResponse.json({ error: 'Erro interno ao convidar funcionário.' }, { status: 500 })
  }
}
