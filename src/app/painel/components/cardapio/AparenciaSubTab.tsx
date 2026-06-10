'use client'

import { ImageUpload } from '@/components/upload/ImageUpload'

interface AparenciaSubTabProps {
  imagemFundo: string
  onAlterarFundo: (url: string) => void
}

export function AparenciaSubTab({ imagemFundo, onAlterarFundo }: AparenciaSubTabProps) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">
        Envie uma imagem leve (ex: textura de papel, linho) para usar como fundo do cardápio.
      </p>
      <ImageUpload
        onUpload={onAlterarFundo}
        defaultImage={imagemFundo}
      />
      {imagemFundo && (
        <button
          onClick={() => onAlterarFundo('')}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Remover fundo personalizado
        </button>
      )}
    </div>
  )
}