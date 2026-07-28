'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GaleriaTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

export default function GaleriaTab({ estabelecimentoId, readOnly }: GaleriaTabProps) {
  // FIX: cliente estabilizado com useRef — antes era recriado a cada
  // render, o que pode causar comportamento inconsistente em componentes
  // que re-renderizam bastante (ex: durante upload/loading state).
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [fotos, setFotos] = useState<string[]>([])
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [fotoCapa, setFotoCapa] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCapa, setUploadingCapa] = useState(false)

  useEffect(() => {
    carregarGaleria()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId])

  async function carregarGaleria() {
    const { data } = await supabase
      .from('estabelecimentos')
      .select('galeria_fotos, logo_url, foto_capa')
      .eq('id', estabelecimentoId)
      .single()
    setFotos(data?.galeria_fotos || [])
    setLogoUrl(data?.logo_url || null)
    setFotoCapa(data?.foto_capa || null)
    setLoading(false)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly || !e.target.files?.length) return
    const file = e.target.files[0]
    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Erro no upload')
      if (!data.secure_url) throw new Error('URL não retornada pelo Cloudinary')

      const { error } = await supabase
        .from('estabelecimentos')
        .update({ logo_url: data.secure_url })
        .eq('id', estabelecimentoId)
      if (error) throw new Error(error.message)
      setLogoUrl(data.secure_url)
    } catch (err: any) {
      alert('Erro ao enviar logo: ' + err.message)
    }
    setUploadingLogo(false)
    e.target.value = ''
  }

  async function removerLogo() {
    if (readOnly) return
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ logo_url: null })
      .eq('id', estabelecimentoId)
    if (error) {
      alert('Erro ao remover logo: ' + error.message)
      return
    }
    setLogoUrl(null)
  }

  async function uploadCapa(e: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly || !e.target.files?.length) return
    const file = e.target.files[0]
    setUploadingCapa(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Erro no upload')
      if (!data.secure_url) throw new Error('URL não retornada pelo Cloudinary')

      const { error } = await supabase
        .from('estabelecimentos')
        .update({ foto_capa: data.secure_url })
        .eq('id', estabelecimentoId)
      if (error) throw new Error(error.message)
      setFotoCapa(data.secure_url)
    } catch (err: any) {
      alert('Erro ao enviar foto de capa: ' + err.message)
    }
    setUploadingCapa(false)
    e.target.value = ''
  }

  async function removerCapa() {
    if (readOnly) return
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ foto_capa: null })
      .eq('id', estabelecimentoId)
    if (error) {
      alert('Erro ao remover foto de capa: ' + error.message)
      return
    }
    setFotoCapa(null)
  }

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (readOnly || !e.target.files?.length) return
    const file = e.target.files[0]
    setUploading(true)

    try {
      // FIX: upload via /api/upload (server-side) em vez de subir direto
      // pro Cloudinary do browser. O jeito antigo dependia de
      // NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET e NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      // — variáveis públicas que exigem o preset ser "unsigned" (sem
      // controle de quem pode subir o quê) e quebravam em produção quando
      // essas variáveis não estavam configuradas no ambiente do browser.
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Erro no upload')
      if (!data.secure_url) throw new Error('URL não retornada pelo Cloudinary')

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
      <h3 className="text-lg font-semibold mb-2">🏷️ Logo</h3>
      <p className="text-xs text-gray-400 mb-3">
        Aparece ao lado do nome na página pública e no meio do QR Code. Ideal: imagem quadrada.
      </p>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-20 w-20 rounded-full border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">🏪</span>
          )}
        </div>
        {!readOnly && (
          <div className="flex flex-col gap-2">
            <label className="bg-orange-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-700 inline-block text-sm w-fit">
              {uploadingLogo ? 'Enviando...' : logoUrl ? 'Trocar logo' : '+ Adicionar logo'}
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" disabled={uploadingLogo} />
            </label>
            {logoUrl && (
              <button onClick={removerLogo} className="text-xs text-red-500 hover:text-red-700 text-left">
                Remover logo
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">🖼️ Foto de capa</h3>
      <p className="text-xs text-gray-400 mb-3">
        Imagem de destaque no topo da página pública do estabelecimento. Ideal: formato paisagem (retangular),
        bem diferente do logo.
      </p>
      <div className="flex flex-col gap-3 mb-8">
        <div className="aspect-[21/9] w-full max-w-xl rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
          {fotoCapa ? (
            <img src={fotoCapa} alt="Foto de capa" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm text-gray-400">Nenhuma foto de capa</span>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-3">
            <label className="bg-orange-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-orange-700 inline-block text-sm w-fit">
              {uploadingCapa ? 'Enviando...' : fotoCapa ? 'Trocar foto de capa' : '+ Adicionar foto de capa'}
              <input type="file" accept="image/*" onChange={uploadCapa} className="hidden" disabled={uploadingCapa} />
            </label>
            {fotoCapa && (
              <button onClick={removerCapa} className="text-xs text-red-500 hover:text-red-700">
                Remover foto de capa
              </button>
            )}
          </div>
        )}
      </div>

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
