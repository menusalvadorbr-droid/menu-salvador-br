'use client'

import QRCode from 'react-qr-code'

interface QrCodeEstilizadoProps {
  data: string
  width?: number
  height?: number
  primaryColor?: string
  bgColor?: string
  logoUrl?: string | null
}

export default function QrCodeEstilizado({
  data,
  width = 180,
  height = 180,
  primaryColor = '#000000',
  bgColor = '#FFFFFF',
  logoUrl,
}: QrCodeEstilizadoProps) {
  return (
    <div className="relative inline-block">
      <div className="p-2 rounded-lg" style={{ backgroundColor: bgColor }}>
        <QRCode
          value={data}
          size={width}
          bgColor={bgColor}
          fgColor={primaryColor}
          level="H"
        />
      </div>
      {logoUrl && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md">
          <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
        </div>
      )}
    </div>
  )
}