/** Monta a URL de transformação de imagem da Cloudflare (`/cdn-cgi/image/`)
 *  em cima de uma URL de origem já servida pela zona configurada em
 *  NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL — não funciona pra URL de outro
 *  domínio (ex. Cloudinary do V1). Sem segredo nenhum aqui (ao contrário de
 *  `src/lib/r2.ts`), então pode ser importado em componente client também.
 *  Doc: https://developers.cloudflare.com/images/transform-images/ */
export function getCloudflareImageUrl(
  url: string | null | undefined,
  opcoes: { width?: number; height?: number; quality?: number; fit?: 'cover' | 'contain' | 'scale-down' } = {}
): string | null {
  if (!url) return null
  const base = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
  if (!base || !url.startsWith(base)) return url

  const { width, height, quality = 80, fit = 'cover' } = opcoes
  const params = [
    width ? `width=${width}` : null,
    height ? `height=${height}` : null,
    `quality=${quality}`,
    `fit=${fit}`,
    'format=auto',
  ]
    .filter(Boolean)
    .join(',')

  const semBarra = base.replace(/\/$/, '')
  const caminho = url.slice(semBarra.length + 1)
  return `${semBarra}/cdn-cgi/image/${params}/${caminho}`
}
