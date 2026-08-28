'use client'

import { Search } from 'lucide-react'

export default function CampoBuscaFila({
  valor,
  onChange,
}: {
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por código ou nome"
        className="w-48 rounded-lg border border-neutral-200 bg-white py-1.5 pl-7 pr-2 text-xs text-neutral-900"
      />
    </div>
  )
}
