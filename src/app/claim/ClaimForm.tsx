'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ClaimFormProps {
  estabelecimentoId: string
  userId: string
  estabelecimentoNome: string
}

export default function ClaimForm({ estabelecimentoId, userId, estabelecimentoNome }: ClaimFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = formData.get('nome') as string
    const telefone = formData.get('telefone') as string
    const mensagem = formData.get('mensagem') as string

    if (!nome || !telefone) {
      setError('Nome e telefone são obrigatórios.')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('restaurant_claims')
        .insert({
          estabelecimento_id: estabelecimentoId,
          usuario_id: userId,
          status: 'pending',
          proof_data: {
            nome,
            telefone,
            mensagem: mensagem || '',
          },
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📨</div>
        <h2 className="text-2xl font-bold text-green-700">Solicitação enviada!</h2>
        <p className="text-gray-600 mt-2">Aguarde a análise do administrador.</p>
        <p className="text-sm text-gray-400 mt-4">Redirecionando...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
        <input
          type="text"
          name="nome"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Seu nome"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
        <input
          type="tel"
          name="telefone"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="(71) 99999-9999"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem (opcional)</label>
        <textarea
          name="mensagem"
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Alguma informação adicional?"
        />
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar solicitação'}
      </button>
    </form>
  )
}