import type { Metadata } from 'next'
import './globals.css'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'Menu Salvador',
  description: 'Diretório de bares e restaurantes em Salvador',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <Breadcrumb />
        {children}
      </body>
    </html>
  )
}