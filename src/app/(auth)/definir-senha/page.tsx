'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Esta página recebe o usuário depois que ele clica no link de:
 * - convite de funcionário (inviteUserByEmail), ou
 * - recuperação de senha (resetPasswordForEmail)
 *
 * Em ambos os casos o Supabase já cria uma sessão temporária via o token
 * da URL antes de chegar aqui (o client do Supabase processa isso
 * automaticamente ao carregar a página, graças ao detectSessionInUrl).
 */
export default function DefinirSenhaPage() {
  const supabase = createClient()
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessaoValida(!!data.session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/painel')
  }

  if (sessaoValida === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <h1 className="text-xl font-bold text-red-600">Link inválido ou expirado</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Solicite um novo link de acesso e tente novamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center">Definir senha</h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          Escolha uma senha para acessar sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha (mínimo 6 caracteres)"
            className="w-full border rounded-lg px-4 py-3"
            required
            minLength={6}
          />
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Confirmar senha"
            className="w-full border rounded-lg px-4 py-3"
            required
            minLength={6}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || sessaoValida === null}
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
          >
            {loading ? 'Salvando...' : 'Salvar senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
