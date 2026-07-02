export interface Breadcrumb {
  label: string
  href: string
}

export function gerarBreadcrumb(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Breadcrumb[] = []
  let acumulado = ''

  // Home
  breadcrumbs.push({ label: 'Home', href: '/' })

  for (const seg of segments) {
    acumulado += '/' + seg
    const label = seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    breadcrumbs.push({ label, href: acumulado })
  }

  return breadcrumbs
}