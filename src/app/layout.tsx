import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Menu Salvador',
  description: 'Diretório de bares e restaurantes em Salvador',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
