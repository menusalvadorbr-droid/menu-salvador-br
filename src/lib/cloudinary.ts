export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  width: number = 300,
  height: number = 300,
  crop: 'fill' | 'fit' | 'limit' = 'fill'
): string | null {
  if (!url) return null
  // Só aceita imagens do Cloudinary — qualquer outro domínio (dado de
  // teste, link colado por engano etc.) é ignorado, porque next/image
  // quebra com domínio externo não liberado no next.config.ts.
  if (!url.includes('res.cloudinary.com')) return null

  const parts = url.split('/upload/')
  if (parts.length === 2) {
    const pathParts = parts[1].split('/')
    const fileName = pathParts[pathParts.length - 1]
    const transformations = `c_${crop},w_${width},h_${height},q_auto,f_auto`
    return `${parts[0]}/upload/${transformations}/${fileName}`
  }
  return null
}