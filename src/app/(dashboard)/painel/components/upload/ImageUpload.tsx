'use client'

import { useState } from 'react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  defaultImage?: string | null
  shape?: 'circle' | 'rectangle'   // <-- controla o formato
  label?: string                    // texto do botão
}

export function ImageUpload({ onUpload, defaultImage = null, shape = 'rectangle', label = 'Enviar imagem' }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null)
  const [uploading, setUploading] = useState(false)

  const uploadParaCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
    formData.append('folder', 'estabelecimentos/' + (shape === 'circle' ? 'logos' : 'capas'))

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    const data = await res.json()
    return data.secure_url || null
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadParaCloudinary(file)
    if (url) {
      setImageUrl(url)
      onUpload(url)
    }
    setUploading(false)
    e.target.value = ''
  }

  const remover = () => {
    setImageUrl(null)
    onUpload('')
  }

  // Classes diferentes conforme shape
  const containerClass = shape === 'circle'
    ? 'relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100'
    : 'relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100'

  const placeholderClass = shape === 'circle'
    ? 'w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50'
    : 'w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50'

  return (
    <div>
      {imageUrl ? (
        <div className={containerClass}>
          <img src={imageUrl} alt={shape === 'circle' ? 'Logo' : 'Capa'} className="w-full h-full object-cover" />
          <button
            onClick={remover}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className={placeholderClass}>
          {shape === 'circle' ? '🖼️ Logo' : '📷 Capa'}
        </div>
      )}
      <label className="inline-block mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-700">
        {uploading ? 'Enviando...' : label}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
    </div>
  )
}