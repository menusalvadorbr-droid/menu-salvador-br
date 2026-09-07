import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/** Cloudflare R2 é compatível com a API S3 — mesmo SDK, só troca o endpoint. */
function clienteR2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  })
}

/** Envia o arquivo pro bucket e retorna a URL pública final (domínio
 *  próprio com Image Transformations habilitado, configurado em
 *  NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL). */
export async function uploadParaR2(buffer: Buffer, chave: string, contentType: string): Promise<string> {
  const client = clienteR2()
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: chave,
      Body: buffer,
      ContentType: contentType,
    })
  )
  const base = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL!.replace(/\/$/, '')
  return `${base}/${chave}`
}
