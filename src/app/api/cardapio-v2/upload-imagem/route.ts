import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadParaR2 } from '@/lib/r2'

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const PASTAS_VALIDAS = ['itens', 'capas'] as const

/**
 * POST /api/cardapio-v2/upload-imagem
 *
 * Armazenamento de imagem do Cardápio V2 é Cloudflare R2 (nunca Cloudinary
 * — ver README.md). As credenciais de R2 são secretas, então o upload
 * precisa passar pelo servidor (diferente do V1, que sobe direto do
 * browser pro Cloudinary com upload_preset sem assinatura).
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const estabelecimentoId = formData.get('estabelecimentoId')
    const pasta = formData.get('pasta')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })
    }
    if (typeof estabelecimentoId !== 'string' || !estabelecimentoId) {
      return NextResponse.json({ error: 'estabelecimentoId é obrigatório.' }, { status: 400 })
    }
    if (typeof pasta !== 'string' || !PASTAS_VALIDAS.includes(pasta as (typeof PASTAS_VALIDAS)[number])) {
      return NextResponse.json({ error: 'pasta inválida.' }, { status: 400 })
    }
    if (!TIPOS_ACEITOS.includes(file.type)) {
      return NextResponse.json({ error: 'Formato de imagem não aceito.' }, { status: 400 })
    }
    if (file.size > TAMANHO_MAXIMO_BYTES) {
      return NextResponse.json({ error: 'Imagem maior que 5MB.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: estabelecimento } = await supabase
      .from('estabelecimentos')
      .select('id, owner_user_id')
      .eq('id', estabelecimentoId)
      .single()

    if (!estabelecimento) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado.' }, { status: 404 })
    }

    const ehDono = estabelecimento.owner_user_id === user.id
    let ehGerente = false
    if (!ehDono) {
      const { data: vinculo } = await supabase
        .from('funcionarios')
        .select('cargo')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle()
      ehGerente = vinculo?.cargo === 'gerente'
    }

    if (!ehDono && !ehGerente) {
      return NextResponse.json({ error: 'Sem permissão para editar este cardápio.' }, { status: 403 })
    }

    const extensao = file.type.split('/')[1]
    const chave = `cardapio-v2/${estabelecimentoId}/${pasta}/${randomUUID()}.${extensao}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadParaR2(buffer, chave, file.type)

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Erro ao enviar imagem do Cardápio V2 pro R2:', err)
    return NextResponse.json({ error: 'Erro interno ao enviar imagem.' }, { status: 500 })
  }
}
