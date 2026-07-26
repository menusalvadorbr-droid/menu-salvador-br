'use client'

import { useState } from 'react'
import { formatarCpf, validarCpf } from '@/lib/cpf'
import { enviarClaim } from './actions'

interface ClaimFormProps {
  estabelecimentoId: string
  estabelecimentoNome: string
}

export default function ClaimForm({ estabelecimentoId, estabelecimentoNome }: ClaimFormProps) {
  const [nomeResponsavel, setNomeResponsavel] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cpfValido = cpf.length === 0 || validarCpf(cpf)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validarCpf(cpf)) {
      setError('Informe um CPF válido.')
      return
    }
    if (!telefone && !whatsapp) {
      setError('Informe pelo menos um telefone ou WhatsApp de contato.')
      return
    }

    setLoading(true)
    try {
      await enviarClaim({
        estabelecimentoId,
        nomeResponsavel,
        cpfResponsavel: cpf,
        telefoneContato: telefone,
        whatsappContato: whatsapp,
      })
      // enviarClaim faz redirect() em caso de sucesso — se chegou aqui
      // sem lançar, o redirect já foi disparado pelo Next.
    } catch (err: any) {
      // O redirect() do Next lança um erro especial (NEXT_REDIRECT) que
      // não deve ser tratado como falha — deixa ele propagar.
      if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err
      setError(err.message || 'Erro ao enviar solicitação.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-500">
        Pra reivindicar <strong>{estabelecimentoNome}</strong>, precisamos confirmar que você
        realmente representa esse negócio. Esses dados ficam visíveis só pra equipe de análise —
        a aprovação é manual e leva até 5 dias úteis. Depois de enviar, você já pode preencher fotos,
        cardápio e horários — isso também ajuda a confirmar que a solicitação é legítima.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo do responsável *</label>
        <input
          type="text"
          required
          value={nomeResponsavel}
          onChange={(e) => setNomeResponsavel(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Seu nome completo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CPF do responsável *</label>
        <input
          type="text"
          required
          inputMode="numeric"
          value={formatarCpf(cpf)}
          onChange={(e) => setCpf(e.target.value)}
          className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
            cpfValido ? 'border-gray-300' : 'border-red-400'
          }`}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {!cpfValido && <p className="text-xs text-red-500 mt-1">CPF inválido</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="(71) 99999-9999"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="(71) 99999-9999"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-3">Pelo menos um dos dois é obrigatório.</p>

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
