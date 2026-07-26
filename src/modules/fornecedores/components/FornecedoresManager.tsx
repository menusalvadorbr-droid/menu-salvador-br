'use client'

import { useState } from 'react'
import { useFornecedores } from '../hooks/useFornecedores'

export default function FornecedoresManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { fornecedores, carregando, adicionar, remover } = useFornecedores(estabelecimentoId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  async function handleAdicionar() {
    if (!nome.trim()) return
    await adicionar(nome.trim(), telefone || undefined, email || undefined)
    setNome('')
    setTelefone('')
    setEmail('')
    setMostrarForm(false)
  }

  if (carregando) return <div className="py-12 text-center text-neutral-400">Carregando fornecedores...</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{fornecedores.length} fornecedores cadastrados</p>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Novo fornecedor'}
        </button>
      </div>

      {mostrarForm && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 p-4">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Nome
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Distribuidora Bahia"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Telefone
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <button
            onClick={handleAdicionar}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Adicionar
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fornecedores.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-2 text-neutral-900">{f.nome}</td>
                <td className="px-4 py-2 text-neutral-500">{f.telefone || '—'}</td>
                <td className="px-4 py-2 text-neutral-500">{f.email || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => confirm(`Remover ${f.nome}?`) && remover(f.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {fornecedores.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Nenhum fornecedor cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
