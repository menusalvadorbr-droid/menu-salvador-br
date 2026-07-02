'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

interface NovoEstabelecimentoFormProps {
  userId: string
}

/**
 * Formulário enxuto de primeiro cadastro: só o essencial para criar o
 * registro e liberar o acesso ao painel de gestão. Endereço, bairro,
 * tipo de cozinha, descrição e redes sociais ficam para a aba
 * "Informações" dentro de /gerenciar, preenchidos com calma depois.
 */
export default function NovoEstabelecimentoForm({ userId }: NovoEstabelecimentoFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const nome = (formData.get('nome') as string)?.trim()
    const telefone = (formData.get('telefone') as string)?.trim()
    const whatsapp = (formData.get('whatsapp') as string)?.trim()

    if (!nome) {
      setError('O nome do estabelecimento é obrigatório.')
      setLoading(false)
      return
    }
    if (!telefone && !whatsapp) {
      setError('Informe pelo menos um telefone ou WhatsApp de contato.')
      setLoading(false)
      return
    }

    try {
      // Gerar slug único: tenta o base, se já existir adiciona sufixo numérico.
      const baseSlug = slugify(nome)
      let slugFinal = baseSlug
      let tentativa = 0

      while (tentativa < 20) {
        const { data: existente } = await supabase
          .from('estabelecimentos')
          .select('id')
          .eq('slug', slugFinal)
          .maybeSingle()

        if (!existente) break
        tentativa += 1
        slugFinal = `${baseSlug}-${tentativa + 1}`
      }

      const { data: novoEstabelecimento, error: insertError } = await supabase
        .from('estabelecimentos')
        .insert({
          nome,
          nome_fantasia: nome,
          slug: slugFinal,
          telefone: telefone || null,
          whatsapp: whatsapp || null,
          owner_user_id: userId,
          status: 'active',
          ativo: true,
        })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)

      // Vai direto para a tela de gestão, aba Informações, para completar
      // bairro, endereço, tipo de cozinha e o resto com calma.
      router.push(`/painel/estabelecimento/${novoEstabelecimento.id}/gerenciar`)
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar estabelecimento.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do estabelecimento *</label>
        <input
          type="text"
          name="nome"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Ex: Restaurante Sabor da Bahia"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            name="telefone"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="(77) 99999-9999"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="tel"
            name="whatsapp"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="(77) 99999-9999"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-2">* Informe pelo menos um dos dois.</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar e continuar'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Endereço, bairro, tipo de cozinha e outras informações você completa na próxima tela.
      </p>
    </form>
  )
}
