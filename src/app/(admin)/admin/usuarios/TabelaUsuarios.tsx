'use client'

import { useState, useTransition } from 'react'
import { alterarRole } from './actions'

export interface UsuarioRow {
  id: string
  nome: string | null
  email: string
  role: string
}

const ROLES = ['usuario', 'dono', 'gerente', 'super_admin']

export default function TabelaUsuarios({ usuarios, meuId }: { usuarios: UsuarioRow[]; meuId: string }) {
  const [lista, setLista] = useState(usuarios)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function mudarRole(id: string, novoRole: string) {
    const anterior = lista
    setLista((prev) => prev.map((u) => (u.id === id ? { ...u, role: novoRole } : u)))
    setErro(null)

    startTransition(async () => {
      try {
        await alterarRole(id, novoRole)
      } catch (e) {
        setLista(anterior)
        setErro(e instanceof Error ? e.message : 'Erro ao alterar permissão')
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      {erro && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{erro}</p>}
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
          <tr>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Permissão</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {lista.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-2 text-neutral-900">
                {u.nome || '—'} {u.id === meuId && <span className="text-xs text-neutral-400">(você)</span>}
              </td>
              <td className="px-4 py-2 text-neutral-500">{u.email}</td>
              <td className="px-4 py-2">
                <select
                  value={u.role}
                  onChange={(e) => mudarRole(u.id, e.target.value)}
                  disabled={isPending}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
