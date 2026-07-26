'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CardapioRecursosTabProps {
  estabelecimento: {
    id: string
    cardapio_variacoes_ativado?: boolean
    cardapio_complementos_ativado?: boolean
  }
  readOnly?: boolean
}

export default function CardapioRecursosTab({ estabelecimento, readOnly }: CardapioRecursosTabProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [variacoesAtivado, setVariacoesAtivado] = useState(estabelecimento.cardapio_variacoes_ativado || false)
  const [complementosAtivado, setComplementosAtivado] = useState(estabelecimento.cardapio_complementos_ativado || false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function salvar(novoVariacoes: boolean, novoComplementos: boolean) {
    if (readOnly) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        cardapio_variacoes_ativado: novoVariacoes,
        cardapio_complementos_ativado: novoComplementos,
      })
      .eq('id', estabelecimento.id)

    setSalvando(false)
    setMensagem(error ? 'Erro ao salvar: ' + error.message : 'Salvo!')
    setTimeout(() => setMensagem(null), 2000)
  }

  function ToggleRow({
    checked,
    onToggle,
    titulo,
    descricao,
  }: {
    checked: boolean
    onToggle: () => void
    titulo: string
    descricao: string
  }) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            role="switch"
            aria-checked={checked}
            onClick={() => !readOnly && onToggle()}
            className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-200'} ${
              readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                checked ? 'translate-x-4' : ''
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">{titulo}</span>
        </label>
        <p className="text-xs text-gray-400 mt-1 ml-11">{descricao}</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">🍽️ Recursos avançados do cardápio</h3>
      <p className="text-sm text-gray-400 mb-4">
        Ative só o que seu negócio usa — nada muda pra quem deixar desligado.
      </p>

      <ToggleRow
        checked={variacoesAtivado}
        onToggle={() => {
          const novo = !variacoesAtivado
          setVariacoesAtivado(novo)
          salvar(novo, complementosAtivado)
        }}
        titulo="Tamanhos/variações de preço"
        descricao='Pra pizzaria (P/M/G/Família) ou marmita (Para 1/Para 2) — adicione tamanhos com preços diferentes em cada item, na aba Cardápio.'
      />

      <ToggleRow
        checked={complementosAtivado}
        onToggle={() => {
          const novo = !complementosAtivado
          setComplementosAtivado(novo)
          salvar(variacoesAtivado, novo)
        }}
        titulo="Grupos de complementos"
        descricao='Pra "monte sua marmita" (proteína + acompanhamentos) ou adicionais de pizza — crie grupos de opções reutilizáveis entre vários itens, na aba Cardápio.'
      />

      {salvando && <p className="text-xs text-gray-400 mt-2">Salvando…</p>}
      {mensagem && <p className="text-xs text-green-600 mt-2">{mensagem}</p>}
    </div>
  )
}
