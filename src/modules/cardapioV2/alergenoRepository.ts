import { createClient } from '@/lib/supabase/client'
import type { CardapioV2Alergeno } from './types'

/** Lê public.allergens diretamente (tabela compartilhada, ver nota de
 * isolamento na migração 20260906_cardapio_v2_schema.sql) — módulo
 * próprio em vez de importar de src/modules/estoque, pra o cardápio V2
 * não depender de outro módulo de domínio. */
export async function listarAlergenos(): Promise<CardapioV2Alergeno[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('allergens').select('id, nome, icone').order('nome', { ascending: true })
  // O erro do supabase-js é um objeto plano (PostgrestError), não uma
  // instância de Error — lançar ele direto faz o overlay do Next (e
  // qualquer try/catch que espera .message) mostrar "[object Object]" em
  // vez da mensagem real. Mesmo padrão já usado em estoqueRepository.ts.
  if (error) throw new Error(error.message)
  return data ?? []
}
