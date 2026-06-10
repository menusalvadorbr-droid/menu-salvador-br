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
}: ItensSubTabProps) {
  return (
    <ListaCategorias
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
  )
}