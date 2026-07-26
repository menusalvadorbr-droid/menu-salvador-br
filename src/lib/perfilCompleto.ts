import { createClient } from '@/lib/supabase/server'
import { calcularIdade } from '@/lib/idade'

export interface StatusPerfil {
  completo: boolean
  faltando: ('cpf' | 'contato' | 'data_nascimento' | 'idade_minima')[]
}

const IDADE_MINIMA = 18

/**
 * Antes de deixar a pessoa reivindicar ou cadastrar um estabelecimento,
 * o perfil dela precisa ter: CPF, pelo menos um contato (telefone ou
 * WhatsApp), e data de nascimento confirmando 18 anos ou mais. Isso
 * existe pra nunca mais pedir esses dados de novo dentro do fluxo de
 * CNPJ — a garantia acontece uma vez só, aqui.
 */
export async function checarPerfilCompleto(userId: string): Promise<StatusPerfil> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf, telefone, whatsapp, data_nascimento')
    .eq('id', userId)
    .maybeSingle()

  const faltando: StatusPerfil['faltando'] = []

  if (!profile?.cpf) faltando.push('cpf')
  if (!profile?.telefone && !profile?.whatsapp) faltando.push('contato')
  if (!profile?.data_nascimento) {
    faltando.push('data_nascimento')
  } else {
    const idade = calcularIdade(profile.data_nascimento)
    if (idade === null || idade < IDADE_MINIMA) faltando.push('idade_minima')
  }

  return { completo: faltando.length === 0, faltando }
}
