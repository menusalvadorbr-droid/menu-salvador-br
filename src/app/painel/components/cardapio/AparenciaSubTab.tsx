'use client'

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
  modeloVisual,
  temaSelecionado,
  temasDisponiveis,
  temasPermitidos,
  imagemFundo,
  onSalvarLayout,
  onAlterarTema,
  onAlterarFundo,
}: AparenciaSubTabProps) {
  return (
    <div className="space-y-6">
      {/* Layout do Cardápio */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">📐 Layout do Cardápio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'sem-foto', label: '📄 Sem foto', desc: 'Lista simples' },
            { value: 'foto-esquerda', label: '📷 Foto esquerda', desc: 'Foto + texto' },
            { value: 'foto-topo', label: '🖼️ Foto topo', desc: 'Foto grande' },
          ].map((op) => (
            <button
              key={op.value}
              onClick={() => onSalvarLayout(op.value)}
              className={`p-4 rounded-xl border-2 text-left transition ${
                modeloVisual === op.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg">{op.label}</div>
              <div className="text-xs text-gray-500 mt-1">{op.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">🎨 Tema</h3>
        <div className="flex flex-wrap gap-2">
          {temasDisponiveis
            .filter((t) => temasPermitidos.includes(t.slug))
            .map((tema) => (
              <button
                key={tema.slug}
                onClick={() => onAlterarTema(tema.slug)}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  temaSelecionado === tema.slug
                    ? 'border-orange-500 bg-orange-50 font-medium'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {tema.nome}
              </button>
            ))}
        </div>
      </div>

      {/* Imagem de Fundo */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">🖼️ Imagem de Fundo</h3>
        <p className="text-sm text-gray-500 mb-2">
          Substitui o fundo padrão do tema. Tamanho recomendado: 1920x1080px.
        </p>
        <ImageUpload
          onUpload={onAlterarFundo}
          defaultImage={imagemFundo}
          tipo="fundo"
        />
        {imagemFundo && (
          <button
            onClick={() => onAlterarFundo('')}
            className="text-red-500 text-sm mt-2 hover:underline"
          >
            Remover imagem de fundo
          </button>
        )}
      </div>
    </div>
  )
}