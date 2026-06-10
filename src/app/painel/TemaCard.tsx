// src/app/painel/components/TemaCard.tsx
'use client'

interface TemaCardProps {
  tema: {
    id: string
    nome: string
    slug: string
    background_image: string | null
    background_color: string
    primary_color: string
    font_family: string
  }
  selecionado: boolean
  onClick: () => void
}

export function TemaCard({ tema, selecionado, onClick }: TemaCardProps) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border-2 p-3 transition-all hover:scale-105 ${
        selecionado ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      <div
        className="w-full h-24 rounded-lg mb-2 flex items-center justify-center"
        style={{
          backgroundImage: tema.background_image ? `url(${tema.background_image})` : 'none',
          backgroundColor: tema.background_color,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <span
          className="text-lg font-bold px-2 py-1 rounded"
          style={{ color: tema.primary_color, fontFamily: tema.font_family }}
        >
          {tema.nome}
        </span>
      </div>
      <p className="text-sm font-medium text-center text-gray-800">{tema.nome}</p>
    </div>
  )
}