'use client'

import { useState, useEffect } from 'react'
import { TemaCard } from '@/app/painel/components/TemaCard'
import { ImageUpload } from '@/components/upload/ImageUpload'

interface AparenciaSubTabProps {
  modeloVisual: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  temaSelecionado: string
  temasDisponiveis: any[]
  temasPermitidos: string[]
  imagemFundo: string
  onSalvarLayout: (layout: string) => void
  onAlterarTema: (slug: string) => void
  onAlterarFundo: (url: string) => void
}

export function AparenciaSubTab({
  modeloVisual: layoutSalvo,
  temaSelecionado: temaSalvo,
  temasDisponiveis,
  temasPermitidos,
  imagemFundo,
  onSalvarLayout,
  onAlterarTema,
  onAlterarFundo,
}: AparenciaSubTabProps) {
  const [layoutTemp, setLayoutTemp] = useState(layoutSalvo)
  const [temaTemp, setTemaTemp] = useState(temaSalvo)
  const [bgTemp, setBgTemp] = useState(imagemFundo)

  useEffect(() => { setLayoutTemp(layoutSalvo) }, [layoutSalvo])
  useEffect(() => { setTemaTemp(temaSalvo) }, [temaSalvo])
  useEffect(() => { setBgTemp(imagemFundo) }, [imagemFundo])

  const temasFiltrados = temasDisponiveis.filter(t => temasPermitidos.includes(t.slug))

  const handleSalvarLayout = () => {
    if (layoutTemp !== layoutSalvo) onSalvarLayout(layoutTemp)
  }
  const handleSalvarTema = () => {
    if (temaTemp !== temaSalvo) onAlterarTema(temaTemp)
  }
  const handleSalvarFundo = () => {
    if (bgTemp !== imagemFundo) onAlterarFundo(bgTemp)
  }

  return (
    <div className="space-y-6">
      {/* Layout */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-lg mb-3">📐 Layout do Cardápio</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={layoutTemp}
            onChange={(e) => setLayoutTemp(e.target.value as any)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="sem-foto">📄 Sem foto</option>
            <option value="foto-esquerda">📷 Foto esquerda</option>
            <option value="foto-topo">📷 Foto topo</option>
          </select>
          <button
            onClick={handleSalvarLayout}
            disabled={layoutTemp === layoutSalvo}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              layoutTemp === layoutSalvo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Salvar layout
          </button>
        </div>
      </div>

      {/* Temas */}
      {temasFiltrados.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-4">🎨 Tema do Cardápio</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {temasFiltrados.map((tema) => (
              <TemaCard
                key={tema.id}
                tema={tema}
                selecionado={temaTemp === tema.slug}
                onClick={() => setTemaTemp(tema.slug)}
              />
            ))}
          </div>
          <button
            onClick={handleSalvarTema}
            disabled={temaTemp === temaSalvo}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              temaTemp === temaSalvo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Salvar tema
          </button>
        </div>
      )}

      {/* Imagem de fundo */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-lg mb-3">🖼️ Imagem de fundo personalizada</h3>
        <p className="text-xs text-gray-500 mb-3">Substitui o fundo do tema atual.</p>
        <ImageUpload onUpload={(url) => setBgTemp(url)} defaultImage={bgTemp} />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSalvarFundo}
            disabled={bgTemp === imagemFundo}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              bgTemp === imagemFundo ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            Salvar fundo
          </button>
          {bgTemp && (
            <button
              onClick={() => { setBgTemp(''); onAlterarFundo('') }}
              className="text-sm text-red-600 hover:underline"
            >
              Remover fundo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}