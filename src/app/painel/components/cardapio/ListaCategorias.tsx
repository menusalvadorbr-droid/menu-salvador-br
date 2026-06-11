'use client'

import { useState } from 'react'
import { ItemCardPreview } from './ItemCardPreview'
import { ItemEditForm } from './ItemEditForm'

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
  onRenomearCategoria: (catId: string, novoNome: string) => void   // NOVA
  onExcluirCategoria: (catId: string) => void                      // NOVA
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
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const handleSave = async (itemId: string, novosDados: any) => {
    await onAtualizarItem(itemId, novosDados)
    setEditandoId(null)
  }

  const itensPromocao = categorias.flatMap((cat: any) =>
    (cat.itens_cardapio || []).filter(
      (item: any) => item.promocao_ativa && item.preco_promocional
    )
  )
  const temPromocao = itensPromocao.length > 0

  return (
    <div className="space-y-4">
      {temPromocao && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm">
          <div className="p-4 border-b bg-green-50">
            <h3 className="font-bold text-green-700">
              🎉 Promoções ({itensPromocao.length} itens)
            </h3>
          </div>
          <div className="divide-y">
            {itensPromocao.map((item: any) => (
              <div key={`promo-${item.id}`}>
                {editandoId === item.id ? (
                  <ItemEditForm
                    item={item}
                    onSave={(dados) => handleSave(item.id, dados)}
                    onCancel={() => setEditandoId(null)}
                    idiomasAtivos={idiomasAtivos}
                  />
                ) : (
                  <ItemCardPreview
                    item={item}
                    layout={modeloVisual}
                    onEdit={() => setEditandoId(item.id)}
                    onDelete={() => onExcluirItem(item.id)}
                    onTogglePromocao={() => onTogglePromocao(item.id, item.promocao_ativa)}
                    onTogglePublicar={() => onPublicarItem(item.id, item.disponivel)}
                    editando={editandoId === item.id}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {categorias.map((cat: any) => {
        const itens = cat.itens_cardapio || []
        return (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {cat.nome} ({itens.length} itens)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const novoNome = prompt('Novo nome da categoria:', cat.nome)
                    if (novoNome) onRenomearCategoria(cat.id, novoNome)
                  }}
                  className="text-blue-600 text-sm"
                >
                  ✏️ Renomear
                </button>
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
                <button
                  onClick={() => onAdicionarItem(cat.id)}
                  className="text-orange-600 text-sm"
                >
                  + Adicionar Item
                </button>
              </div>
            </div>
            {itens.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Nenhum item nesta categoria.
              </div>
            ) : (
              <div className="divide-y">
                {itens.map((item: any) => (
                  <div key={item.id}>
                    {editandoId === item.id ? (
                      <ItemEditForm
                        item={item}
                        onSave={(dados) => handleSave(item.id, dados)}
                        onCancel={() => setEditandoId(null)}
                        idiomasAtivos={idiomasAtivos}
                      />
                    ) : (
                      <ItemCardPreview
                        item={item}
                        layout={modeloVisual}
                        onEdit={() => setEditandoId(item.id)}
                        onDelete={() => onExcluirItem(item.id)}
                        onTogglePromocao={() => onTogglePromocao(item.id, item.promocao_ativa)}
                        onTogglePublicar={() => onPublicarItem(item.id, item.disponivel)}
                        editando={editandoId === item.id}
                      />
                    )}
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