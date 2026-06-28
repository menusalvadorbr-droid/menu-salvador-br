'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { toPng } from 'html-to-image'

interface QrCodeTabProps {
  estabelecimentoId: string
  shortUrl: string
  slug: string
  logoUrl?: string | null
  readOnly?: boolean
  modeloQr?: {
    cor_frente: string
    cor_fundo: string
    slug: string
  } | null
}

export default function QrCodeTab({
  estabelecimentoId,
  shortUrl,
  slug,
  logoUrl,
  readOnly = false,
  modeloQr,
}: QrCodeTabProps) {
  const [isClient, setIsClient] = useState(false)
  const [link, setLink] = useState('')
  const [qrRef, setQrRef] = useState<HTMLDivElement | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [baixando, setBaixando] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setLink(`${window.location.origin}/cardapio/${slug}`)
  }, [slug])

  const frente = modeloQr?.cor_frente || '#000000'
  const fundo = modeloQr?.cor_fundo || '#FFFFFF'

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch (_) {
      alert('Copie o link manualmente: ' + link)
    }
  }

  const baixarQR = async () => {
    if (!qrRef) return
    setBaixando(true)
    try {
      const dataUrl = await toPng(qrRef, {
        width: 400,
        height: 400,
        backgroundColor: fundo,
      })
      const downloadLink = document.createElement('a')
      downloadLink.download = `qrcode-${slug}.png`
      downloadLink.href = dataUrl
      downloadLink.click()
    } catch (err) {
      console.error('Erro ao baixar QR:', err)
      alert('Erro ao baixar QR Code. Tente novamente.')
    }
    setBaixando(false)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="text-2xl">📱</span> QR Code do Cardápio
      </h3>

      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col items-center">
        {isClient ? (
          <div
            ref={setQrRef}
            className="p-6 rounded-2xl inline-block"
            style={{ backgroundColor: fundo }}
          >
            <QRCode
              value={link}
              size={200}
              bgColor={fundo}
              fgColor={frente}
              level="H"
            />
          </div>
        ) : (
          <div className="p-6 rounded-2xl inline-block" style={{ backgroundColor: fundo }}>
            <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded flex items-center justify-center">
              <span className="text-gray-400">Carregando QR Code...</span>
            </div>
          </div>
        )}

        {logoUrl && (
          <div className="relative -mt-12 mb-2">
            <img
              src={logoUrl}
              alt="Logo"
              className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
            />
          </div>
        )}

        {isClient ? (
          <p className="text-sm text-gray-500 mt-4 font-mono break-all text-center">
            {link}
          </p>
        ) : (
          <p className="text-sm text-gray-300 mt-4 font-mono break-all text-center">
            Carregando link...
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={copiarLink}
            disabled={!isClient}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition disabled:opacity-50"
          >
            {copiado ? '✅ Copiado!' : '📋 Copiar link'}
          </button>
          <button
            onClick={baixarQR}
            disabled={baixando || !isClient}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition disabled:opacity-50"
          >
            {baixando ? '⏳ Baixando...' : '⬇️ Baixar QR Code'}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-700">📌 Como usar</h4>
        <ul className="text-sm text-gray-500 space-y-1 mt-2 list-disc list-inside">
          <li>Imprima o QR Code e coloque nas mesas do seu estabelecimento.</li>
          <li>O cliente escaneia e acessa o cardápio digital diretamente.</li>
          <li>Atualizações no cardápio são refletidas automaticamente.</li>
          <li>Não precisa gerar um novo QR Code ao alterar o cardápio.</li>
        </ul>
      </div>
    </div>
  )
}