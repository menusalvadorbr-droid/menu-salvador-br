// src/app/painel/components/cardapio/CardapioTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { ListaCategorias } from './ListaCategorias'
import { TemaCard } from '../TemaCard'   // ✅ CORRIGIDO
import { ImageUpload } from '@/components/upload/ImageUpload'

interface CardapioTabProps {
  categorias: any[]
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  temaSelecionado: string
  backgroundImageAtual: string | null
  temasDisponiveis: any[]
  temasPermitidos: string[]
  limitePlano: number
  idiomasSelecionados: string[]
  onSalvarLayout: (layout: string) => void
  onSalvarTema: (slug: string) => void
  onSalvarBackgroundImage: (url: string | null) => void
  onNovaCategoria: () => void
  onAdicionarItem: (catId: string) => void
  onAtualizarItem: (itemId: string, novosDados: any) => void
  onExcluirItem: (itemId: string) => void
  onTogglePromocao: (itemId: string, ativaAtual: boolean) => void
  onPublicarItem: (itemId: string, disponivelAtual: boolean) => void
  onRenomearCategoria: (catId: string, novoNome: string) => void   // NOVA
  onExcluirCategoria: (catId: string) => void                      // NOVA
}

export function CardapioTab({
  categorias,
  modeloVisual: layoutSalvo,
  temaSelecionado: temaSalvo,
  backgroundImageAtual: bgSalvo,
  temasDisponiveis,
  temasPermitidos,
  limitePlano,
  idiomasSelecionados,
  onSalvarLayout,
  onSalvarTema,
  onSalvarBackgroundImage,
  onNovaCategoria,
  onAdicionarItem,
  onAtualizarItem,
  onExcluirItem,
  onTogglePromocao,
  onPublicarItem,
  onRenomearCategoria,    // NOVA
  onExcluirCategoria,     // NOVA
}: CardapioTabProps) {
  // Layout
  const [layoutAtual, setLayoutAtual] = useState(layoutSalvo)
  const [layoutTemp, setLayoutTemp] = useState(layoutSalvo)

  // Tema
  const [temaAtual, setTemaAtual] = useState(temaSalvo)
  const [temaTemp, setTemaTemp] = useState(temaSalvo)

  // Fundo
  const [bgAtual, setBgAtual] = useState(bgSalvo)
  const [bgTemp, setBgTemp] = useState(bgSalvo)

  // Temas disponíveis (filtrados pelos permitidos no plano)
  const temasDisponiveisFiltrados = temasDisponiveis.filter(t => temasPermitidos.includes(t.slug))

  // Sincronização
  useEffect(() => {
    setLayoutAtual(layoutSalvo)
    setLayoutTemp(layoutSalvo)
  }, [layoutSalvo])

  useEffect(() => {
    setTemaAtual(temaSalvo)
    setTemaTemp(temaSalvo)
  }, [temaSalvo])

  useEffect(() => {
    setBgAtual(bgSalvo)
    setBgTemp(bgSalvo)
  }, [bgSalvo])

  const handleSaveLayout = async () => {
    if (layoutTemp === layoutAtual) return
    setLayoutAtual(layoutTemp)
    await onSalvarLayout(layoutTemp)
  }

  const handleSaveTema = async () => {
    if (temaTemp === temaAtual) return
    setTemaAtual(temaTemp)
    await onSalvarTema(temaTemp)
  }

  const handleSaveBackground = async () => {
    if (bgTemp === bgAtual) return
    setBgAtual(bgTemp)
    await onSalvarBackgroundImage(bgTemp)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">📋 Meu Cardápio</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout */}
          <div className="flex items-center gap-1">
            <select
              value={layoutTemp}
              onChange={(e) => setLayoutTemp(e.target.value as any)}
              className="border rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              <option value="sem-foto">📄 Sem foto</option>
              <option value="foto-esquerda">📷 Foto esquerda</option>
              <option value="foto-topo">📷 Foto topo</option>
            </select>
            <button
              onClick={handleSaveLayout}
              disabled={layoutTemp === layoutAtual}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                layoutTemp === layoutAtual
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              Salvar
            </button>
          </div>

          {/* Nova Categoria */}
          <button
            onClick={onNovaCategoria}
            className="border-2 border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100"
          >
            ➕ Nova Categoria
          </button>
        </div>
      </div>

      {/* Seletor de Temas */}
      {temasDisponiveisFiltrados.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h3 className="font-bold text-lg mb-4">🎨 Aparência do Cardápio</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {temasDisponiveisFiltrados.map((tema) => (
              <TemaCard
                key={tema.id}
                tema={tema}
                selecionado={temaTemp === tema.slug}
                onClick={() => setTemaTemp(tema.slug)}
              />
            ))}
          </div>
          <button
            onClick={handleSaveTema}
            disabled={temaTemp === temaAtual}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              temaTemp === temaAtual
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Salvar tema
          </button>
        </div>
      )}

      {/* Imagem de fundo personalizada */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <h3 className="font-bold text-lg mb-4">🖼️ Imagem de fundo personalizada</h3>
        <p className="text-xs text-gray-500 mb-3">Envie uma imagem leve (ex: textura de papel, linho). Substitui o fundo do tema atual.</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1">
            <ImageUpload onUpload={(url) => setBgTemp(url)} defaultImage={bgTemp} />
          </div>
          <button
            onClick={handleSaveBackground}
            disabled={bgTemp === bgAtual}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              bgTemp === bgAtual
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Salvar fundo
          </button>
        </div>
        {bgAtual && (
          <div className="mt-3 text-xs text-gray-500">
            Fundo atual: <a href={bgAtual} target="_blank" className="text-blue-600 underline">Visualizar</a>
          </div>
        )}
      </div>

      {/* Lista de categorias e itens */}
      <ListaCategorias
        categorias={categorias}
        onAtualizarItem={onAtualizarItem}
        onExcluirItem={onExcluirItem}
        onTogglePromocao={onTogglePromocao}
        onPublicarItem={onPublicarItem}
        limitePlano={limitePlano}
        modeloVisual={layoutAtual}
        idiomasAtivos={idiomasSelecionados}
        onAdicionarItem={onAdicionarItem}
        onRenomearCategoria={onRenomearCategoria}   {/* NOVA */}
        onExcluirCategoria={onExcluirCategoria}      {/* NOVA */}
      />
    </div>
  )
}