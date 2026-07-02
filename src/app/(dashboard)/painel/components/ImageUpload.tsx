'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'

interface ImageUploadProps {
  onUpload: (url: string) => void
  onRemove?: () => void
  currentImage?: string | null
  label?: string
  aspectRatio?: 'square' | '16:9' | '4:3'
  maxSize?: number
}

export default function ImageUpload({
  onUpload,
  onRemove,
  currentImage,
  label = 'Foto do item',
  aspectRatio = 'square',
  maxSize = 2,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const optimizarImagem = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height
          const MAX_SIZE = 800
          if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject('Erro ao criar canvas')
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject('Erro ao comprimir imagem')
            },
            'image/webp',
            0.8
          )
        }
        img.onerror = () => reject('Erro ao carregar imagem')
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject('Erro ao ler arquivo')
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.')
      return
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`A imagem deve ter no máximo ${maxSize}MB.`)
      return
    }

    setUploading(true)
    setProgress(10)

    try {
      const imagemOtimizada = await optimizarImagem(file)
      setProgress(50)

      // Upload direto (unsigned) – sem assinatura
      // FIX: upload via API route interna para não expor credenciais no browser
      // e evitar "Failed to fetch" quando variáveis NEXT_PUBLIC não estão no .env.local
      const formData = new FormData()
      formData.append('file', imagemOtimizada)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      setProgress(90)

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message || 'Erro no upload')
      }
      if (!uploadData.secure_url) {
        throw new Error(uploadData.error || 'URL não retornada pelo Cloudinary')
      }

      setPreview(uploadData.secure_url)
      setProgress(100)
      onUpload(uploadData.secure_url)
    } catch (err: any) {
      console.error('Erro no upload:', err)
      alert('Erro ao enviar imagem: ' + err.message)
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (onRemove) onRemove()
  }

  const aspectRatioClass = {
    square: 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
  }[aspectRatio]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <div className={`w-24 h-24 rounded-lg overflow-hidden border border-gray-200 ${aspectRatioClass}`}>
              <NextImage src={preview} alt="Prévia" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className={`w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 ${aspectRatioClass}`}>
            <span className="text-2xl">📷</span>
          </div>
        )}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? `Enviando ${progress}%...` : preview ? 'Trocar foto' : 'Escolher foto'}
          </label>
          <p className="text-xs text-gray-400 mt-1">Até {maxSize}MB • WebP otimizado</p>
          {uploading && (
            <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}