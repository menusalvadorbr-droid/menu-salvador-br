'use client'

import { useState } from 'react'
import { ItensSubTab } from './ItensSubTab'
import { CategoriasSubTab } from './CategoriasSubTab'
import { AparenciaSubTab } from './AparenciaSubTab'

interface CardapioTabProps {
  categorias: any[]
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  temaSelecionado: string
  temasDisponiveis: any[]
  temasPermitidos: string[]
  limitePlano: number
  idiomasAtivos: string[]
  imagemFundo: string
  onSalvarLayout: (layout: string) => void
  onAlterarTema: (slug: string) => void
  onAlterarFundo: (url: string) => void
  onNovaCategoria: () => void
  onRenomearCategoria: (catId: string, novoNome: string) => void
  onExcluirCategoria: (catId: string) => void
  onAdicionarItem: (catId: string) => void
  onUpdateItem: (itemId: string, dados: any) => void
  onDeleteItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onTogglePublicar: (itemId: string, disponivelAtual: boolean) => void
}

const SUB_TABS = [
  { key: 'itens', label: '📋 Itens' },
  { key: 'categorias', label: '📁 Categorias' },
  { key: 'aparencia', label: '🎨 Aparência' },
]

export function CardapioTab({
  categorias,
  modeloVisual,
  temaSelecionado,
  temasDisponiveis,
  temasPermitidos,
  limitePlano,
  idiomasAtivos,
  imagemFundo,
  onSalvarLayout,
  onAlterarTema,
  onAlterarFundo,
  onNovaCategoria,
  onRenomearCategoria,
  onExcluirCategoria,
  onAdicionarItem,
  onUpdateItem,
  onDeleteItem,
  onTogglePromocao,
  onTogglePublicar,
}: CardapioTabProps) {
  const [subAba, setSubAba] = useState('itens')

  return (
    <div>
      {/* Título da aba principal */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">📋 Meu Cardápio</h2>
      </div>

      {/* Sub-tabs internas */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubAba(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap ${
              subAba === tab.key
                ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da sub-aba ativa */}
      {subAba === 'itens' && (
        <ItensSubTab
          categorias={categorias}
          modeloVisual={modeloVisual}
          idiomasAtivos={idiomasAtivos}
          limitePlano={limitePlano}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onTogglePromocao={onTogglePromocao}
          onTogglePublicar={onTogglePublicar}
          onAdicionarItem={onAdicionarItem}
        />
      )}

      {subAba === 'categorias' && (
        <CategoriasSubTab
          categorias={categorias}
          onNovaCategoria={onNovaCategoria}
          onRenomearCategoria={onRenomearCategoria}
          onExcluirCategoria={onExcluirCategoria}
        />
      )}

      {subAba === 'aparencia' && (
        <AparenciaSubTab
          modeloVisual={modeloVisual}
          temaSelecionado={temaSelecionado}
          temasDisponiveis={temasDisponiveis}
          temasPermitidos={temasPermitidos}
          imagemFundo={imagemFundo}
          onSalvarLayout={onSalvarLayout}
          onAlterarTema={onAlterarTema}
          onAlterarFundo={onAlterarFundo}
        />
      )}
    </div>
  )
}