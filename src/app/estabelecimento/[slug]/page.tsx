'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export default function PerfilEstabelecimento() {
  const params = useParams()
  const slug = params.slug as string

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modeloQR, setModeloQR] = useState<any>(null)

  useEffect(() => {
    async function carregarEstabelecimento() {
      setLoading(true)
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setErro('Estabelecimento não encontrado')
        setLoading(false)
        return
      }

      setEstabelecimento(data)

      // Registrar visualização (fire-and-forget)
      supabase
        .from('estabelecimentos')
        .update({ visualizacoes: (data.visualizacoes || 0) + 1 })
        .eq('id', data.id)
        .then(() => {})

      // Buscar modelo de QR Code
      if (data.qrcode_modelo) {
        const { data: modelo } = await supabase
          .from('modelos_qrcode')
          .select('*')
          .eq('slug', data.qrcode_modelo)
          .single()
        if (modelo) setModeloQR(modelo)
      }

      // Se não houver modelo salvo, usar o padrão 'classico'
      if (!data.qrcode_modelo) {
        const { data: modeloPadrao } = await supabase
          .from('modelos_qrcode')
          .select('*')
          .eq('slug', 'classico')
          .single()
        if (modeloPadrao) setModeloQR(modeloPadrao)
      }

      setLoading(false)
    }

    if (slug) carregarEstabelecimento()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (erro || !estabelecimento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Estabelecimento não encontrado</h1>
          <Link href="/" className="text-orange-600 hover:underline">← Voltar para o diretório</Link>
        </div>
      </div>
    )
  }

  const frente = modeloQR?.cor_frente || '#000000'
  const fundo = modeloQR?.cor_fundo || '#FFFFFF'
  const urlQR = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/menu/${estabelecimento.qrcode_short_url}`

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-red-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/" className="text-white/80 hover:text-white text-sm">← Voltar para o diretório</Link>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
              {estabelecimento.tipo_estabelecimento === 'banca_acaraje' ? '🫘' : 
               estabelecimento.tipo_estabelecimento === 'bar' ? '🍺' :
               estabelecimento.tipo_estabelecimento === 'restaurante' ? '🍽️' :
               estabelecimento.tipo_estabelecimento === 'cafeteria' ? '☕' :
               estabelecimento.tipo_estabelecimento === 'foodtruck' ? '🚚' : '🏪'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{estabelecimento.nome}</h1>
                {estabelecimento.destaque && <span className="text-2xl">⭐</span>}
                {estabelecimento.verificado && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">✓ Verificado</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-white/90 text-sm mb-4">
                <span>📍 {estabelecimento.bairro}</span>
                <span>•</span>
                <span>🍳 {estabelecimento.tipo_cozinha}</span>
                <span>•</span>
                <span>🏪 {estabelecimento.tipo_estabelecimento}</span>
              </div>
              <div className="flex gap-3">
                {estabelecimento.whatsapp && (
                  <a href={`https://wa.me/55${estabelecimento.whatsapp.replace(/\D/g, '')}`} target="_blank" className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600">💬 WhatsApp</a>
                )}
                {estabelecimento.instagram && (
                  <a href={`https://instagram.com/${estabelecimento.instagram.replace('@', '')}`} target="_blank" className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-600">📸 Instagram</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {estabelecimento.descricao && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-3">📝 Sobre</h2>
                <p className="text-gray-600 leading-relaxed">{estabelecimento.descricao}</p>
              </div>
            )}

            {/* Seção do QR Code Real */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">📱 Cardápio Digital</h2>
              <p className="mb-6 opacity-90">Escaneie o QR Code ou acesse o link para ver o menu completo</p>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCode
                  value={urlQR}
                  size={160}
                  bgColor={fundo}
                  fgColor={frente}
                  level="H"
                />
              </div>
              {estabelecimento.qrcode_short_url && (
                <div>
                  <p className="text-sm mb-2 opacity-75">menu.salvador.br/menu/{estabelecimento.qrcode_short_url}</p>
                  <Link
                    href={`/menu/${estabelecimento.qrcode_short_url}`}
                    className="inline-block bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition"
                  >
                    Ver Menu Online →
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-3">📍 Localização</h2>
              <p className="text-gray-600 mb-2">{estabelecimento.endereco}</p>
              <p className="text-gray-500 text-sm">{estabelecimento.bairro} - Salvador/BA</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">ℹ️ Informações</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cozinha</span>
                  <span className="font-medium">{estabelecimento.tipo_cozinha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-medium">{estabelecimento.tipo_estabelecimento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bairro</span>
                  <span className="font-medium">{estabelecimento.bairro}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Visualizações</span>
                  <span className="font-medium">{estabelecimento.visualizacoes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scans QR</span>
                  <span className="font-medium">{estabelecimento.scans_qrcode || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">📞 Contato</h3>
              <div className="space-y-3">
                {estabelecimento.telefone && (
                  <a href={`tel:${estabelecimento.telefone}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">📞 {estabelecimento.telefone}</a>
                )}
                {estabelecimento.whatsapp && (
                  <a href={`https://wa.me/55${estabelecimento.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-2 text-green-600 hover:text-green-700">💬 {estabelecimento.whatsapp}</a>
                )}
                {estabelecimento.email && (
                  <a href={`mailto:${estabelecimento.email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">✉️ {estabelecimento.email}</a>
                )}
                {estabelecimento.instagram && (
                  <a href={`https://instagram.com/${estabelecimento.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-2 text-pink-600 hover:text-pink-700">📸 {estabelecimento.instagram}</a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}