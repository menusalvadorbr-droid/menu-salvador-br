'use client'

import { useState } from 'react'
import { ItemCard } from './ItemCard'

interface ListaCategoriasProps {
  categorias: any[]
  onUpdateItem: (itemId: string, novosDados: any) => void
  onDeleteItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onTogglePublicar: (itemId: string, disponivelAtual: boolean) => void
  limitePlano: number
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  idiomasAtivos: string[]
  onAdicionarItem: (categoriaId: string) => void
}

export function ListaCategorias({
  categorias,
  onUpdateItem,
  onDeleteItem,
  onTogglePromocao,
  onTogglePublicar,
  limitePlano,
  modeloVisual,
  idiomasAtivos,
  onAdicionarItem,
}: ListaCategoriasProps) {
  // Itens promocionais (exibidos em seção especial)
  const itensPromocao = categorias.flatMap((cat: any) =>
    (cat.itens_cardapio || []).filter(
      (item: any) => item.promocao_ativa && item.preco_promocional
    )
  )
  const temPromocao = itensPromocao.length > 0

  return (
    <div className="space-y-4">
      {/* Seção de Promoções (se houver) */}
      {temPromocao && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm">
          <div className="p-4 border-b bg-green-50">
            <h3 className="font-bold text-green-700">
              🎉 Promoções ({itensPromocao.length} itens)
            </h3>
          </div>
          <div className="divide-y">
            {itensPromocao.map((item: any) => (
              <ItemCard
                key={`promo-${item.id}`}
                item={item}
                layout={modeloVisual}
                idiomasAtivos={idiomasAtivos}
                onSave={(dados) => onUpdateItem(item.id, dados)}
                onDelete={() => onDeleteItem(item.id)}
                onTogglePromocao={() => onTogglePromocao(item.id, item.promocao_ativa)}
                onTogglePublicar={() => onTogglePublicar(item.id, item.disponivel)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categorias normais */}
      {categorias.map((cat: any) => {
        const itens = cat.itens_cardapio || []
        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {cat.nome} ({itens.length} itens)
              </h3>
              <button
                onClick={() => onAdicionarItem(cat.id)}
                className="text-orange-600 text-sm font-medium hover:underline"
              >
                + Adicionar Item
              </button>
            </div>
            {itens.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Nenhum item nesta categoria. Clique em "+ Adicionar Item" para começar.
              </div>
            ) : (
              <div className="divide-y">
                {itens.map((item: any) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    layout={modeloVisual}
                    idiomasAtivos={idiomasAtivos}
                    onSave={(dados) => onUpdateItem(item.id, dados)}
                    onDelete={() => onDeleteItem(item.id)}
                    onTogglePromocao={() => onTogglePromocao(item.id, item.promocao_ativa)}
                    onTogglePublicar={() => onTogglePublicar(item.id, item.disponivel)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}