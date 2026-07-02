import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase para uso em Client Components ('use client').
 * Cria uma nova instância a cada chamada (recomendado pelo Supabase
 * para evitar problemas de estado compartilhado entre usuários/sessões).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
