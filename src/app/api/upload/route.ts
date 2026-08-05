import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: 'Variáveis de ambiente não configuradas' }, { status: 500 })
  }

  const cloudinaryFormData = new FormData()
  cloudinaryFormData.append('file', file)
  cloudinaryFormData.append('upload_preset', uploadPreset)

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudinaryFormData,
    })
    const data = await res.json()
    // Antes sempre respondia 200 aqui, mesmo quando o Cloudinary recusava o
    // upload (preset inválido, etc.) — o cliente só descobria pela ausência
    // de secure_url, sem o status real pra diferenciar os casos. Loga
    // server-side também, pra aparecer no log do deploy sem depender só do
    // alert no navegador.
    if (!res.ok) console.error('Cloudinary recusou o upload:', res.status, data)
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Falha na comunicação com Cloudinary:', err)
    return NextResponse.json({ error: 'Falha na comunicação com Cloudinary' }, { status: 500 })
  }
}
