'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Estado de login checado no cliente (não vem mais do layout via cookies())
 * — o layout público precisa ficar sem cookies() pra poder entrar no ISR
 * (revalidate=120 nas páginas de diretório/cardápio; um layout que lê
 * cookies() força TODA página por baixo dele a renderizar dinâmica, não
 * importa o revalidate da própria página). Começa como "não logado" (mesmo
 * texto que a maioria dos visitantes vê) até a checagem no navegador
 * terminar, evitando esconder o banner promocional por padrão.
 */
export default function PublicHeader() {
  const [logado, setLogado] = useState(false)

  useEffect(() => {
    let cancelado = false
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelado) setLogado(!!data.user)
    })
    return () => { cancelado = true }
  }, [])

  return (
    <>
      {/* Banner promocional só faz sentido pra quem ainda não tem conta —
          um dono já logado não precisa ser convidado a se cadastrar de novo. */}
      {!logado && (
        <div
          className="px-4 py-2 text-center text-xs font-medium text-white sm:text-sm"
          style={{
            background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))',
          }}
        >
          🏪 É dono de um restaurante ou bar?{' '}
          <Link href="/estabelecimentos/novo" className="font-bold underline hover:text-yellow-200">
            Cadastre seu cardápio digital grátis
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-lg font-black tracking-tight text-neutral-900">
            menu<span style={{ color: 'var(--brand-primary)' }}>.salvador</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-neutral-600">
            <Link href="/" className="hidden sm:inline hover:text-neutral-900">
              Explorar
            </Link>
            {logado ? (
              <Link
                href="/painel"
                className="rounded-full px-4 py-2 text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                Meu painel
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline hover:text-neutral-900">
                  Entrar
                </Link>
                <Link
                  href="/estabelecimentos/novo"
                  className="rounded-full px-4 py-2 text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  Cadastrar negócio
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}
