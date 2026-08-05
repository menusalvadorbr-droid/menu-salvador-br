'use client'

import { useEffect, useRef, useState } from 'react'
import type { SpecialOfferRow } from '@/lib/specialOffers'
import {
  desenharPostInstagram,
  carregarImagem,
  carregarFonteGoogle,
  gerarLegendaPost,
  TAMANHO_POST,
  type ModeloPost,
  type CoresPost,
} from '@/lib/instagramPost'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

interface GerarPostInstagramModalProps {
  oferta: SpecialOfferRow
  cores: CoresPost
  fonteNome: string
  nomeEstabelecimento: string
  bairro: string | null
  tipoEstabelecimento: string | null
  onFechar: () => void
}

const MODELOS: { valor: ModeloPost; label: string; descricao: string }[] = [
  { valor: 'foto', label: 'Foto em destaque', descricao: 'Foto grande, nome e preço numa faixa embaixo' },
  { valor: 'moldura', label: 'Cartão com moldura', descricao: 'Foto centralizada com borda, texto abaixo' },
  { valor: 'texto', label: 'Texto em destaque', descricao: 'Nome e preço grandes — ideal sem foto boa' },
]

/**
 * Gera uma imagem (1080×1080, via <canvas> no navegador) e uma legenda
 * sugerida pra publicar a promoção/combo no Instagram — sem nenhuma
 * integração com a API do Instagram, o dono baixa e publica na mão.
 */
export default function GerarPostInstagramModal({
  oferta,
  cores,
  fonteNome,
  nomeEstabelecimento,
  bairro,
  tipoEstabelecimento,
  onFechar,
}: GerarPostInstagramModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelo, setModelo] = useState<ModeloPost>('foto')
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [legendaCopiada, setLegendaCopiada] = useState(false)

  const legenda = gerarLegendaPost(oferta, nomeEstabelecimento, bairro, tipoEstabelecimento)

  // Carrega a fonte do tema (Google Fonts, via Font Loading API) e a foto
  // da promoção uma vez só — independe de qual modelo está selecionado.
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      const urlFoto = getOptimizedCloudinaryUrl(oferta.foto_url, 1200, 1200, 'fill')
      const [, img] = await Promise.all([carregarFonteGoogle(fonteNome), carregarImagem(urlFoto)])
      if (cancelado) return
      setImagem(img)
      setCarregando(false)
    }
    carregar()
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oferta.id, fonteNome])

  // Redesenha sempre que o modelo muda ou os recursos terminam de carregar.
  useEffect(() => {
    if (carregando) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    desenharPostInstagram(ctx, modelo, imagem, oferta, cores, fonteNome)
  }, [modelo, carregando, imagem, oferta, cores, fonteNome])

  function baixarImagem() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) {
        setErro('Não foi possível gerar a imagem. Tente novamente.')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nomeArquivo = oferta.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      a.download = `${nomeArquivo || 'promocao'}-instagram.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  async function copiarLegenda() {
    try {
      await navigator.clipboard.writeText(legenda)
      setLegendaCopiada(true)
      setTimeout(() => setLegendaCopiada(false), 2500)
    } catch {
      setErro('Não foi possível copiar automaticamente — selecione e copie o texto manualmente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900">📸 Gerar post pra Instagram</h2>
            <p className="text-xs text-gray-400 mt-0.5">{oferta.nome}</p>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {erro && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">{erro}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Modelo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MODELOS.map((m) => (
                <button
                  key={m.valor}
                  onClick={() => setModelo(m.valor)}
                  className={`text-left p-3 rounded-xl border-2 transition ${
                    modelo === m.valor ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.descricao}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              {carregando && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Gerando prévia…
                </div>
              )}
              <canvas ref={canvasRef} width={TAMANHO_POST} height={TAMANHO_POST} className="w-full h-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-600">Legenda sugerida</label>
              <button onClick={copiarLegenda} className="text-xs font-semibold text-orange-600 hover:underline">
                {legendaCopiada ? '✓ Copiada!' : '📋 Copiar legenda'}
              </button>
            </div>
            <textarea
              readOnly
              value={legenda}
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 resize-none focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Fechar
          </button>
          <button
            onClick={baixarImagem}
            disabled={carregando}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition"
          >
            ⬇️ Baixar imagem
          </button>
        </div>
      </div>
    </div>
  )
}
