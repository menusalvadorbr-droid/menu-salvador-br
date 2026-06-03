import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'menu.salvador.br – Cardápios Digitais',
  description: 'Encontre os melhores restaurantes, bares e acarajés de Salvador com cardápio digital.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  )
}