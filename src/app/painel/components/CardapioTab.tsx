// src/app/painel/components/CardapioTab.tsx
'use client'

import { ListaCategorias } from './ListaCategorias'

interface CardapioTabProps {
  categorias: any[]
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  temaSelecionado: string
  temasDisponiveis: any[]
  temasPermitidos: string[]
  limitePlano: number
  idiomasSelecionados: string[]
  onSalvarLayout: (layout: string) => void
  onAlterarTema: (slug: string) => void
  onNovaCategoria: () => void
  onAdicionarItem: (catId: string) => void
  onAtualizarItem: (itemId: string, novosDados: any) => void
  onExcluirItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onPublicarItem: (itemId: string, disponivelAtual: boolean) => void
}

export function CardapioTab({
  categorias,
  modeloVisual,
  temaSelecionado,
  temasDisponiveis,
  temasPermitidos,
  limitePlano,
  idiomasSelecionados,
  onSalvarLayout,
  onAlterarTema,
  onNovaCategoria,
  onAdicionarItem,
  onAtualizarItem,
  onExcluirItem,
  onTogglePromocao,
  onPublicarItem,
}: CardapioTabProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">📋 Meu Cardápio</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de layout do cardápio */}
          <select
            value={modeloVisual}
            onChange={(e) => onSalvarLayout(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            <option value="sem-foto">📄 Sem foto</option>
            <option value="foto-esquerda">📷 Foto esquerda</option>
            <option value="foto-topo">📷 Foto topo</option>
          </select>

          {/* Seletor de tema visual */}
          <select
            value={temaSelecionado}
            onChange={(e) => onAlterarTema(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white"
          >
            {temasDisponiveis
              .filter((t) => temasPermitidos.includes(t.slug))
              .map((tema) => (
                <option key={tema.slug} value={tema.slug}>
                  🎨 {tema.nome}
                </option>
              ))}
          </select>

          {/* Botão para criar nova categoria */}
          <button
            onClick={onNovaCategoria}
            className="border-2 border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100"
          >
            ➕ Nova Categoria
          </button>
        </div>
      </div>

      {/* Lista de categorias e itens */}
      <ListaCategorias
        categorias={categorias}
        onAtualizarItem={onAtualizarItem}
        onExcluirItem={onExcluirItem}
        onTogglePromocao={onTogglePromocao}
        onPublicarItem={onPublicarItem}
        limitePlano={limitePlano}
        modeloVisual={modeloVisual}
        idiomasAtivos={idiomasSelecionados}
        onAdicionarItem={onAdicionarItem}
      />
    </div>
  )
}