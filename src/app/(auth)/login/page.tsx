'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Só aceita caminhos internos (começando com "/", sem "//" — que o
// navegador trataria como protocolo-relativo pra outro domínio). Evita
// que um link malicioso tipo /login?redirect=https://site-falso.com
// mande a pessoa pra fora do site depois de logar.
function redirectSeguro(valor: string | null): string {
  if (!valor) return '/painel'
  if (!valor.startsWith('/') || valor.startsWith('//')) return '/painel'
  return valor
}

function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = redirectSeguro(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push(destino)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.refresh()
    setTimeout(() => {
      router.push(destino)
    }, 200)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Mesmo tratamento de marca do Hero.tsx (gradiente 135° nas cores da
            plataforma + wordmark) — usa as CSS vars globais em vez de cor
            fixa, então acompanha sozinho se a paleta da plataforma mudar em
            Configurações → Paleta. */}
        <div
          className="px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
        >
          <h1 className="text-2xl font-black tracking-tight text-white">
            menu<span className="opacity-80">.salvador</span>
          </h1>
          <p className="mt-1 text-sm text-white/85">Painel do estabelecimento</p>
        </div>

        <div className="px-6 pb-6 pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-neutral-600">
            Não tem conta?{' '}
            <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}