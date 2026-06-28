export function getOptimizedCloudinaryUrl(
  url: string | null,
  width: number = 300,
  height: number = 300,
  crop: 'fill' | 'fit' | 'limit' = 'fill'
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com')) return url

  // Se já tiver transformações, apenas retorna
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      const transformations = `w_${width},h_${height},c_${crop},q_auto,f_auto`
      return `${parts[0]}/upload/${transformations}/${parts[1]}`
    }
  }
  return url
}

export function getCloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // Usado com next/image com loader customizado
  if (!src.includes('cloudinary.com')) return src
  const parts = src.split('/upload/')
  if (parts.length === 2) {
    const q = quality || 80
    return `${parts[0]}/upload/w_${width},q_${q},f_auto/${parts[1]}`
  }
  return src
}