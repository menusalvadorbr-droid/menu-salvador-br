'use client'

import { useState } from 'react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  defaultImage?: string
  tipo?: 'item' | 'capa'
}

export function ImageUpload({ onUpload, defaultImage, tipo = 'item' }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultImage || '')
  const [enviando, setEnviando] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.secure_url) {
        setImageUrl(data.secure_url)
        onUpload(data.secure_url)
      } else if (data.url) {
        setImageUrl(data.url)
        onUpload(data.url)
      } else {
        throw new Error(data.error?.message || 'Erro desconhecido')
      }
    } catch (err: any) {
      alert('Falha ao enviar: ' + err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      {imageUrl ? (
        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => {
              setImageUrl('')
              onUpload('')
            }}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            type="button"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="w-full h-48 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
          {tipo === 'capa' ? '📷 Foto de capa' : '🍽️ Foto do item'}
        </div>
      )}
      <label className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-center block">
        {enviando ? '⏳ Enviando...' : '📸 Upload Imagem'}
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={enviando} />
      </label>
    </div>
  )
}