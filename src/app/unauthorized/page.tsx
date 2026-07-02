import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800">Acesso não autorizado</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Você não tem permissão para acessar esta área.
        </p>
        <Link
          href="/painel"
          className="inline-block mt-6 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  )
}
