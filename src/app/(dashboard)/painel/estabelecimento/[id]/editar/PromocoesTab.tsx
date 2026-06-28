'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface PromocoesTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

export default function PromocoesTab({ estabelecimentoId, readOnly }: PromocoesTabProps) {
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarItens()
  }, [estabelecimentoId])

  async function carregarItens() {
    const { data } = await supabase
      .from('itens_cardapio')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('nome')
    setItens(data || [])
    setLoading(false)
  }

  async function togglePromocao(id: string, ativa: boolean) {
    if (readOnly) return
    const item = itens.find(i => i.id === id)
    await supabase
      .from('itens_cardapio')
      .update({
        promocao_ativa: !ativa,
        preco_promocional: !ativa ? item?.preco_promocional || null : null,
      })
      .eq('id', id)
    carregarItens()
  }

  async function atualizarPrecoPromocional(id: string, preco: number) {
    if (readOnly) return
    await supabase
      .from('itens_cardapio')
      .update({ preco_promocional: preco })
      .eq('id', id)
    carregarItens()
  }

  if (loading) return <div className="text-gray-500">Carregando...</div>

  const itensPromocao = itens.filter(i => i.promocao_ativa)

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">⭐ Promoções</h3>

      {itensPromocao.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">Promoções ativas</h4>
          <div className="space-y-2">
            {itensPromocao.map(item => (
              <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.nome}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    De R$ {item.preco?.toFixed(2)} por R$ {item.preco_promocional?.toFixed(2)}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => togglePromocao(item.id, true)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remover promoção
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h4 className="font-medium text-gray-700 mb-2">Itens disponíveis</h4>
      <div className="space-y-2">
        {itens.filter(i => !i.promocao_ativa).length === 0 && (
          <p className="text-gray-400 text-sm">Todos os itens já estão em promoção.</p>
        )}
        {itens.filter(i => !i.promocao_ativa).map(item => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
            <span>{item.nome} – R$ {item.preco?.toFixed(2)}</span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço promocional"
                  className="border rounded-lg px-2 py-1 text-sm w-32"
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value)
                    if (val && val > 0) {
                      atualizarPrecoPromocional(item.id, val)
                      togglePromocao(item.id, false)
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const preco = prompt('Preço promocional:', item.preco?.toString())
                    if (preco && parseFloat(preco) > 0) {
                      atualizarPrecoPromocional(item.id, parseFloat(preco))
                      togglePromocao(item.id, false)
                    }
                  }}
                  className="bg-orange-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-orange-700"
                >
                  Criar promoção
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}