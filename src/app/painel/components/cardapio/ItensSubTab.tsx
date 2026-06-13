'use client'

import { ListaCategorias } from './ListaCategorias'

interface ItensSubTabProps {
  categorias: any[]
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  idiomasAtivos: string[]
  limitePlano: number
  onAtualizarItem: (itemId: string, dados: any) => void
  onExcluirItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onTogglePublicar: (itemId: string, disponivelAtual: boolean) => void
  onCriarItem: (categoriaId: string, dados: any) => void
  onRenomearCategoria: (catId: string, novoNome: string) => void
  onExcluirCategoria: (catId: string) => void
}

export function ItensSubTab({
  categorias,
  modeloVisual,
  idiomasAtivos,
  limitePlano,
  onAtualizarItem,
  onExcluirItem,
  onTogglePromocao,
  onTogglePublicar,
  onCriarItem,
  onRenomearCategoria,
  onExcluirCategoria,
}: ItensSubTabProps) {
  return (
    <ListaCategorias
      categorias={categorias}
      modeloVisual={modeloVisual}
      idiomasAtivos={idiomasAtivos}
      limitePlano={limitePlano}
      onAtualizarItem={onAtualizarItem}
      onExcluirItem={onExcluirItem}
      onTogglePromocao={onTogglePromocao}
      onPublicarItem={onTogglePublicar}
      onCriarItem={onCriarItem}
      onRenomearCategoria={onRenomearCategoria}
      onExcluirCategoria={onExcluirCategoria}
    />
  )
}