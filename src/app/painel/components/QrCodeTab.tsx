// src/app/painel/components/QrCodeTab.tsx
'use client'

interface QrCodeTabProps {
  shortUrl: string | null
  modelosQRDisponiveis: any[]
  modelosQRPermitidos: string[]
  modeloQRSelecionado: string
  alterarModeloQR: (slug: string) => void
}

export function QrCodeTab({
  shortUrl,
  modelosQRDisponiveis,
  modelosQRPermitidos,
  modeloQRSelecionado,
  alterarModeloQR,
}: QrCodeTabProps) {
  if (!shortUrl) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">📱 Meu QR Code</h2>
        <p className="text-gray-500">QR Code ainda não disponível.</p>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const qrUrl = `${baseUrl}/menu/${shortUrl}`

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📱 Meu QR Code</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Escolher Estilo</h3>
          <div className="grid grid-cols-2 gap-4">
            {modelosQRDisponiveis.map((modelo: any) => {
              const permitido = modelosQRPermitidos.includes(modelo.slug)
              const ativo = modeloQRSelecionado === modelo.slug
              return (
                <button
                  key={modelo.slug}
                  disabled={!permitido}
                  onClick={() => alterarModeloQR(modelo.slug)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  } ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_frente }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_fundo, border: '1px solid #ddd' }} />
                  </div>
                  <p className="font-semibold text-gray-800">{modelo.nome}</p>
                  <p className="text-xs text-gray-500">{modelo.descricao}</p>
                  {!permitido && <span className="text-xs text-red-500 mt-1 block">🔒 Plano superior</span>}
                  {ativo && <span className="text-xs text-orange-600 mt-1 block">✓ Em uso</span>}
                </button>
              )
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            width={200}
            height={200}
          />
          <p className="mt-4 text-sm text-gray-600 break-all">{qrUrl}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(qrUrl)
              alert('Link copiado!')
            }}
            className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            📋 Copiar Link
          </button>
        </div>
      </div>
    </div>
  )
}