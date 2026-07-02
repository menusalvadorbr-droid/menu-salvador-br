'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface FilterBarProps {
  cidade?: string
  bairro?: string
  bairros?: string[]
  tipos?: string[]
  cozinhas?: string[]
  cozinhaAtual?: string
}

export default function FilterBar({
  cidade,
  bairro,
  bairros = [],
  tipos = [],
  cozinhas = [],
  cozinhaAtual,
}: FilterBarProps) {
  const router = useRouter()
  const params = useSearchParams()
  const bairroParam = params.get('bairro') || ''
  const tipoParam = params.get('tipo') || ''
  const cozinhaParam = params.get('cozinha') || ''

  const basePath = cidade && bairro ? `/${cidade}/${bairro}` : (cidade ? `/${cidade}` : '/')

  const aplicarFiltro = (key: string, value: string) => {
    const newParams = new URLSearchParams(params.toString())
    if (value) newParams.set(key, value)
    else newParams.delete(key)
    router.push(`${basePath}?${newParams.toString()}`)
  }

  const limparFiltros = () => {
    router.push(basePath)
  }

  const hasFilters = bairroParam || tipoParam || cozinhaParam

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {bairros.length > 0 && (
          <select
            value={bairroParam || bairro || ''}
            onChange={(e) => aplicarFiltro('bairro', e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Todos os bairros</option>
            {bairros.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        {tipos.length > 0 && (
          <select
            value={tipoParam}
            onChange={(e) => aplicarFiltro('tipo', e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {cozinhas.length > 0 && (
          <select
            value={cozinhaParam || cozinhaAtual || ''}
            onChange={(e) => aplicarFiltro('cozinha', e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Todas as cozinhas</option>
            {cozinhas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={limparFiltros}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}