'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nome },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Mesmo cabeçalho de marca do /login — wordmark + gradiente 135° nas
            cores da plataforma (CSS vars globais, acompanha sozinho se a
            paleta mudar em Configurações → Paleta). */}
        <div
          className="px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
        >
          <h1 className="text-2xl font-black tracking-tight text-white">
            menu<span className="opacity-80">.salvador</span>
          </h1>
          <p className="mt-1 text-sm text-white/85">Cadastre-se para começar</p>
        </div>

        <div className="px-6 pb-6 pt-6">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="nome" className="mb-1 block text-sm font-medium text-neutral-700">
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900"
                required
              />
            </div>
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
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-neutral-900"
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">✅ Conta criada! Redirecionando para o login...</p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-lg py-3 font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}