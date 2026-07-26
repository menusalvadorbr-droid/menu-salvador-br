'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'

interface Estabelecimento {
  id: string
  aceita_pets?: boolean | null
  estacionamento?: string | null
  acessibilidade?: string[] | null
}

const OPCOES_ACESSIBILIDADE = [
  'Rampa de acesso',
  'Banheiro adaptado',
  'Cardápio em braile',
  'Mesa adaptada para cadeira de rodas',
]

const OPCOES_ESTACIONAMENTO = [
  { valor: 'proprio', label: '🅿️ Estacionamento próprio' },
  { valor: 'valet', label: '🚗 Manobrista' },
  { valor: 'rua', label: '🅿️ Estacionamento na rua' },
  { valor: 'nao_tem', label: '🚫 Sem estacionamento' },
]

export default function ComodidadesTab({ estabelecimento }: { estabelecimento: Estabelecimento }) {
  const supabase = createClient()
  const [aceitaPets, setAceitaPets] = useState(estabelecimento.aceita_pets || false)
  const [estacionamento, setEstacionamento] = useState(estabelecimento.estacionamento || '')
  const [acessibilidade, setAcessibilidade] = useState<string[]>(estabelecimento.acessibilidade || [])
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function toggleAcessibilidade(item: string) {
    setAcessibilidade((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  async function salvar() {
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('estabelecimentos')
        .update({
          aceita_pets: aceitaPets,
          estacionamento: estacionamento || null,
          acessibilidade,
        })
        .eq('id', estabelecimento.id)

      if (error) throw new Error(error.message)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch (err) {
      logSupabaseError('Erro ao salvar comodidades', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-neutral-800">✨ Comodidades</h3>
        <p className="text-xs text-neutral-500">
          Essas informações aparecem na página pública, na seção "Comodidades" (se estiver ativada
          pelo admin geral da plataforma).
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <input
          type="checkbox"
          checked={aceitaPets}
          onChange={(e) => setAceitaPets(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm text-neutral-800">🐾 Aceita pets</span>
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Estacionamento</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPCOES_ESTACIONAMENTO.map((opcao) => (
            <label
              key={opcao.valor}
              className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                estacionamento === opcao.valor
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-neutral-200 bg-white text-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="estacionamento"
                checked={estacionamento === opcao.valor}
                onChange={() => setEstacionamento(opcao.valor)}
              />
              {opcao.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Acessibilidade</p>
        <div className="flex flex-wrap gap-2">
          {OPCOES_ACESSIBILIDADE.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleAcessibilidade(item)}
              className={`rounded-full px-3 py-1.5 text-sm border ${
                acessibilidade.includes(item)
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-neutral-200 bg-white text-neutral-600'
              }`}
            >
              ♿ {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar comodidades'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
      </div>
    </div>
  )
}
