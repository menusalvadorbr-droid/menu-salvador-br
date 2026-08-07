import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase para Server Components 100% públicos, sem leitura de
 * cookies (ao contrário de `./server.ts`, que chama `await cookies()` e por
 * isso força a rota inteira pro modo dinâmico — sem ISR possível). Só
 * anon key, sem sessão de usuário: use apenas em páginas que não dependem
 * de autenticação/RLS por usuário (ex: cardápio público).
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
