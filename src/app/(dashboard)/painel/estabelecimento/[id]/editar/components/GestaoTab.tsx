'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GestaoTabProps {
  estabelecimento: {
    id: string
    gestao_modulo_ativado?: boolean
  }
  readOnly?: boolean
}

export default function GestaoTab({ estabelecimento, readOnly }: GestaoTabProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [ativado, setAtivado] = useState(estabelecimento.gestao_modulo_ativado || false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function salvar(novo: boolean) {
    if (readOnly) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ gestao_modulo_ativado: novo })
      .eq('id', estabelecimento.id)

    setSalvando(false)
    setMensagem(error ? 'Erro ao salvar: ' + error.message : 'Salvo!')
    setTimeout(() => setMensagem(null), 2000)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">🛠️ Módulo de Gestão</h3>
      <p className="text-sm text-gray-400 mb-4">
        Pedidos, Estoque, Caixa e Fornecedores ficam sempre visíveis na aba Gestão, mas desativados até você
        ligar aqui.
      </p>

      <div className="py-3 border-b border-gray-100 last:border-0">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="switch"
            aria-checked={ativado}
            onClick={() => {
              if (readOnly) return
              const novo = !ativado
              setAtivado(novo)
              salvar(novo)
            }}
            className={`relative w-9 h-5 rounded-full transition-colors ${ativado ? 'bg-orange-500' : 'bg-gray-200'} ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                ativado ? 'translate-x-4' : ''
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">Ativar módulo de Gestão</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-11">
          Libera o acesso a Pedidos, Estoque, Caixa e Fornecedores pra todo mundo que usa esse painel.
        </p>
      </div>

      {salvando && <p className="text-xs text-gray-400 mt-2">Salvando…</p>}
      {mensagem && <p className="text-xs text-green-600 mt-2">{mensagem}</p>}
    </div>
  )
}
