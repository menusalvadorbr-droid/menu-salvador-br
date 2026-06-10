'use client'

import { useState } from 'react'

interface Categoria {
  id: string
  nome: string
  ordem: number
  itens_cardapio?: any[]
}

interface CategoriasSubTabProps {
  categorias: Categoria[]
  onNovaCategoria: () => void
  onRenomearCategoria: (catId: string, novoNome: string) => void
  onExcluirCategoria: (catId: string) => void
}

export function CategoriasSubTab({
  categorias,
  onNovaCategoria,
  onRenomearCategoria,
  onExcluirCategoria,
}: CategoriasSubTabProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEditando, setNomeEditando] = useState('')

  const handleComecarEdicao = (cat: Categoria) => {
    setEditandoId(cat.id)
    setNomeEditando(cat.nome)
  }

  const handleSalvarEdicao = (catId: string) => {
    if (nomeEditando.trim()) {
      onRenomearCategoria(catId, nomeEditando.trim())
    }
    setEditandoId(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          📁 Categorias ({categorias.length})
        </h3>
        <button
          onClick={onNovaCategoria}
          className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700"
        >
          ➕ Nova Categoria
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          Nenhuma categoria criada. Clique em "Nova Categoria" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {categorias
            .sort((a, b) => a.ordem - b.ordem)
            .map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                {editandoId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={nomeEditando}
                      onChange={(e) => setNomeEditando(e.target.value)}
                      className="border rounded px-2 py-1 text-sm flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSalvarEdicao(cat.id)}
                      className="text-green-600 text-sm font-medium"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="text-gray-500 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="font-medium text-gray-800">{cat.nome}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {cat.itens_cardapio?.length || 0} itens
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComecarEdicao(cat)}
                        className="text-blue-500 text-sm"
                        title="Renomear"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir categoria "${cat.nome}"? Os itens ficarão sem categoria.`)) {
                            onExcluirCategoria(cat.id)
                          }
                        }}
                        className="text-red-500 text-sm"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}