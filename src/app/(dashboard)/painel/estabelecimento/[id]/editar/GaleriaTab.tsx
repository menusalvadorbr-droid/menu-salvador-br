'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface GaleriaTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

export default function GaleriaTab({ estabelecimentoId, readOnly }: GaleriaTabProps) {
  const [fotos, setFotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    carregarGaleria()
  }, [estabelecimentoId])

  async function carregarGaleria() {
    const { data } = await supabase
      .from('estabelecimentos')
      .select('galeria_fotos')
      .eq('id', estabelecimentoId)
      .single()
    setFotos(data?.galeria_fotos || [])
    setLoading(false)
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly || !e.target.files?.length) return
    const file = e.target.files[0]
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'menu-salvador')

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)

      const novaUrl = data.secure_url
      const novasFotos = [...fotos, novaUrl]
      await supabase.from('estabelecimentos').update({ galeria_fotos: novasFotos }).eq('id', estabelecimentoId)
      setFotos(novasFotos)
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function removerFoto(index: number) {
    if (readOnly) return
    const novasFotos = fotos.filter((_, i) => i !== index)
    await supabase.from('estabelecimentos').update({ galeria_fotos: novasFotos }).eq('id', estabelecimentoId)
    setFotos(novasFotos)
  }

  if (loading) return <div className="text-gray-500">Carregando...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">🖼️ Galeria</h3>

      {!readOnly && (
        <div className="mb-4">
          <label className="bg-orange-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-700 inline-block text-sm">
            {uploading ? 'Enviando...' : '+ Adicionar foto'}
            <input type="file" accept="image/*" onChange={uploadFoto} className="hidden" disabled={uploading} />
          </label>
          <p className="text-xs text-gray-400 mt-1">Formatos: JPG, PNG, WEBP. Tamanho máximo: 5MB.</p>
        </div>
      )}

      {fotos.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Nenhuma foto na galeria.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fotos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
              <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
              {!readOnly && (
                <button
                  onClick={() => removerFoto(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}