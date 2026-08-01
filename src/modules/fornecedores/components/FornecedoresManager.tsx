'use client'

import { useState } from 'react'
import { useFornecedores } from '../hooks/useFornecedores'
import { formatarCnpj, validarCnpj } from '@/lib/cnpj'

export default function FornecedoresManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { fornecedores, carregando, adicionar, remover } = useFornecedores(estabelecimentoId)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [email, setEmail] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Fornecedor pode ser pessoa física, sem CNPJ nenhum — só avisa (não
  // bloqueia o cadastro) quando algo foi digitado e não fecha como CNPJ válido.
  const cnpjPreenchidoInvalido = cnpj.trim().length > 0 && !validarCnpj(cnpj)

  async function handleAdicionar() {
    if (!nome.trim()) return
    await adicionar({
      nome: nome.trim(),
      telefone: telefone || undefined,
      whatsapp: whatsapp || undefined,
      cnpj: cnpj || undefined,
      endereco: endereco || undefined,
      email: email || undefined,
      observacoes: observacoes || undefined,
    })
    setNome('')
    setTelefone('')
    setWhatsapp('')
    setCnpj('')
    setEndereco('')
    setEmail('')
    setObservacoes('')
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
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
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
            WhatsApp
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            CNPJ <span className="font-normal text-neutral-400">(opcional)</span>
            <input
              value={formatarCnpj(cnpj)}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              maxLength={18}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
            {cnpjPreenchidoInvalido && <span className="font-normal text-amber-600">CNPJ não confere — confira os números.</span>}
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Endereço
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade…"
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
          <label className="flex flex-col gap-1 text-xs text-neutral-500 sm:col-span-2">
            Observações
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <button
            onClick={handleAdicionar}
            disabled={!nome.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40 sm:col-span-2"
          >
            Adicionar
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">WhatsApp</th>
              <th className="px-4 py-2">CNPJ</th>
              <th className="px-4 py-2">E-mail</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {fornecedores.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-2 text-neutral-900">{f.nome}</td>
                <td className="px-4 py-2 text-neutral-500">{f.telefone || '—'}</td>
                <td className="px-4 py-2 text-neutral-500">{f.whatsapp || '—'}</td>
                <td className="px-4 py-2 text-neutral-500">{f.cnpj ? formatarCnpj(f.cnpj) : '—'}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
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
