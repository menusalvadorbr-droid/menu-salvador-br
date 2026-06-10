'use client'

import { useState } from 'react'

interface ListaCategoriasProps {
  categorias: any[]
  onAtualizarItem: (itemId: string, novosDados: any) => void
  onExcluirItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onPublicarItem: (itemId: string, disponivelAtual: boolean) => void
  limitePlano: number
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  idiomasAtivos: string[]
  onAdicionarItem: (categoriaId: string) => void
  onRenomearCategoria: (catId: string, novoNome: string) => void
  onExcluirCategoria: (catId: string) => void
}

export function ListaCategorias({
  categorias,
  onAtualizarItem,
  onExcluirItem,
  onTogglePromocao,
  onPublicarItem,
  limitePlano,
  modeloVisual,
  idiomasAtivos,
  onAdicionarItem,
  onRenomearCategoria,
  onExcluirCategoria,
}: ListaCategoriasProps) {
  // Estado local não é mais necessário, pois a edição é tratada em outro componente
  // Mantenha apenas se for usado para algo.

  // Itens promocionais (duplicados na categoria especial)
  const itensPromocao = categorias.flatMap((cat: any) =>
    (cat.itens_cardapio || []).filter(
      (item: any) => item.promocao_ativa && item.preco_promocional
    )
  )
  const temPromocao = itensPromocao.length > 0

  return (
    <div className="space-y-4">
      {/* Seção de promoções, se houver */}
      {temPromocao && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm">
          <div className="p-4 border-b bg-green-50">
            <h3 className="font-bold text-green-700">
              🎉 Promoções ({itensPromocao.length} itens)
            </h3>
          </div>
          <div className="divide-y">
            {itensPromocao.map((item: any) => (
              <div key={`promo-${item.id}`} className="p-4">
                {/* Renderização simplificada do item promocional */}
                <p className="font-medium">{item.nome}</p>
                <p className="text-sm text-gray-500">{item.descricao}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-red-500">R$ {item.preco_promocional?.toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">R$ {item.preco?.toFixed(2)}</span>
                </div>
              </div>
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
              <div className="flex gap-2">
                {/* Botão de renomear categoria */}
                <button
                  onClick={() => {
                    const novoNome = prompt('Novo nome da categoria:', cat.nome)
                    if (novoNome) onRenomearCategoria(cat.id, novoNome)
                  }}
                  className="text-blue-600 text-sm"
                >
                  ✏️ Renomear
                </button>
                {/* Botão de excluir categoria */}
                <button
                  onClick={() => {
                    if (confirm(`Excluir a categoria "${cat.nome}" e todos os seus itens?`)) {
                      onExcluirCategoria(cat.id)
                    }
                  }}
                  className="text-red-600 text-sm"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <button
                onClick={() => onAdicionarItem(cat.id)}
                className="text-orange-600 text-sm"
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
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-sm text-gray-500">{item.descricao}</p>
                      <p className="text-sm">R$ {item.preco?.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      {/* Ações do item */}
                      <button
                        onClick={() => onTogglePromocao(item.id, item.promocao_ativa)}
                        className={`text-xs px-2 py-1 rounded ${
                          item.promocao_ativa ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.promocao_ativa ? 'Remover Promo' : 'Promo'}
                      </button>
                      <button
                        onClick={() => onPublicarItem(item.id, item.disponivel)}
                        className={`text-xs px-2 py-1 rounded ${
                          item.disponivel ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.disponivel ? 'Publicado' : 'Publicar'}
                      </button>
                      <button
                        onClick={() => onExcluirItem(item.id)}
                        className="text-xs text-red-500"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}