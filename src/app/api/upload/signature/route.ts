import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST() {
  try {
    const timestamp = Math.round(Date.now() / 1000)
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: 'cardapio',
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        // Otimização automática no upload
        transformation: {
          width: 400,
          height: 400,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      },
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
      folder: 'cardapio',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar assinatura' }, { status: 500 })
  }
}