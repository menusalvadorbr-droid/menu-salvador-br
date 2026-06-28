'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Se estiver na home, não exibe breadcrumb
  if (segments.length === 0) return null

  return (
    <nav className="text-xs text-gray-400 py-2 px-4 bg-white/80 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm">
      <ol className="flex flex-wrap items-center gap-1 max-w-7xl mx-auto">
        <li>
          <Link href="/" className="hover:text-gray-600 transition">Home</Link>
        </li>
        {segments.map((seg, i) => {
          // Se o segmento for um parâmetro dinâmico (ex: [id]), não cria link
          const isDynamicParam = seg.startsWith('[') && seg.endsWith(']')
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1

          // Formata o nome: substitui hífens por espaços, capitaliza
          let label = seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

          // Se for um parâmetro dinâmico, tenta usar um nome mais amigável
          if (isDynamicParam) {
            // Exibe "Detalhes" ou "Editar" em vez de [id]
            const friendlyNames: Record<string, string> = {
              '[id]': 'Detalhes',
              '[slug]': 'Perfil',
              '[shortUrl]': 'Cardápio',
            }
            label = friendlyNames[seg] || seg
          }

          return (
            <li key={i} className="flex items-center">
              <span className="mx-1 text-gray-300">/</span>
              {isLast || isDynamicParam ? (
                <span className={`${isLast ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-gray-600 transition">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}