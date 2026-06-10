'use client'

import { ListaCategorias } from './ListaCategorias'

interface ItensSubTabProps {
  categorias: any[]
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  idiomasAtivos: string[]
  limitePlano: number
  onUpdateItem: (itemId: string, dados: any) => void
  onDeleteItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onTogglePublicar: (itemId: string, disponivelAtual: boolean) => void
  onAdicionarItem: (categoriaId: string) => void
  onRenomearCategoria: (catId: string, novoNome: string) => void
  onExcluirCategoria: (catId: string) => void
}

export function ItensSubTab({
  categorias,
  modeloVisual,
  idiomasAtivos,
  limitePlano,
  onUpdateItem,
  onDeleteItem,
  onTogglePromocao,
  onTogglePublicar,
  onAdicionarItem,
  onRenomearCategoria,
  onExcluirCategoria,
}: ItensSubTabProps) {
  return (
    <ListaCategorias
      categorias={categorias}
      modeloVisual={modeloVisual}
      idiomasAtivos={idiomasAtivos}
      limitePlano={limitePlano}
      onAtualizarItem={onUpdateItem}
      onExcluirItem={onDeleteItem}
      onTogglePromocao={onTogglePromocao}
      onPublicarItem={onTogglePublicar}
      onAdicionarItem={onAdicionarItem}
      onRenomearCategoria={onRenomearCategoria}
      onExcluirCategoria={onExcluirCategoria}
    />
  )
}