'use client'

import { useState } from 'react'

interface UploadImagemV2Props {
  estabelecimentoId: string
  pasta: 'itens' | 'capas'
  onUpload: (url: string) => void
  defaultImage?: string | null
  shape?: 'circle' | 'rectangle'
  label?: string
}

/**
 * Equivalente ao `ImageUpload` do V1, mas sobe pro Cloudflare R2 via
 * `/api/cardapio-v2/upload-imagem` em vez de Cloudinary — armazenamento de
 * imagem do Cardápio V2 é R2, nunca Cloudinary (ver README.md). Não
 * reaproveitar o `ImageUpload` do V1 aqui: ele tem a URL/preset do
 * Cloudinary hardcoded.
 */
export default function UploadImagemV2({
  estabelecimentoId,
  pasta,
  onUpload,
  defaultImage = null,
  shape = 'rectangle',
  label = 'Enviar imagem',
}: UploadImagemV2Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    setErro(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('estabelecimentoId', estabelecimentoId)
      formData.append('pasta', pasta)

      const res = await fetch('/api/cardapio-v2/upload-imagem', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar imagem.')

      setImageUrl(data.url)
      onUpload(data.url)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setEnviando(false)
      e.target.value = ''
    }
  }

  const remover = () => {
    setImageUrl(null)
    onUpload('')
  }

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
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          <button
            onClick={remover}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className={placeholderClass}>📷</div>
      )}
      <label className="inline-block mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-orange-700">
        {enviando ? 'Enviando...' : label}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={enviando} />
      </label>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  )
}
