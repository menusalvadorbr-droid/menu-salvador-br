'use server'

import { checarSuperAdmin } from '@/lib/auth/checarSuperAdmin'
import { revalidatePath } from 'next/cache'

export interface TraducaoInterfaceAlteracao {
  chave: string
  idioma: 'en' | 'fr' | 'es'
  valor: string
}

export async function salvarTraducoesInterface(alteracoes: TraducaoInterfaceAlteracao[]) {
  const { supabase } = await checarSuperAdmin()

  const paraSalvar = alteracoes.filter((a) => a.valor.trim() !== '')
  const paraApagar = alteracoes.filter((a) => a.valor.trim() === '')

  if (paraSalvar.length > 0) {
    const { error } = await supabase
      .from('traducoes_interface')
      .upsert(paraSalvar, { onConflict: 'chave,idioma' })
    if (error) throw new Error(error.message)
  }

  // Campo esvaziado pelo admin volta a cair no fallback em português —
  // não faz sentido guardar uma linha com valor vazio pra isso.
  for (const a of paraApagar) {
    const { error } = await supabase
      .from('traducoes_interface')
      .delete()
      .eq('chave', a.chave)
      .eq('idioma', a.idioma)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/traducoes-interface')
  // Textos fixos aparecem em qualquer cardápio/perfil — precisa invalidar
  // os dois padrões de rota pública, não só uma página específica.
  revalidatePath('/cardapio/[slug]', 'page')
  revalidatePath('/[[...slug]]', 'page')
}
