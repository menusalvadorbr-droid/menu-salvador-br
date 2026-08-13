'use client'

import { useState } from 'react'
import { gerarSlug } from '@/lib/slug'
import { criarCidade, editarCidade, removerCidade } from './actions'

export interface CidadeComContagem {
  id: string
  nome: string
  slug: string
  totalBairros: number
  totalEstabelecimentos: number
}

/**
 * cidades é a lista de cobertura do menu.salvador, não um catálogo livre
 * — só o que está aqui aparece como opção válida no cadastro por CNPJ.
 * Diferente de bairros/tipos, remover uma cidade em uso é bloqueado pelo
 * banco (sem "on delete set null"), então o aviso abaixo é só
 * informativo — quem garante é a constraint.
 */
export default function CidadesManager({ cidadesIniciais }: { cidadesIniciais: CidadeComContagem[] }) {
  const [cidades, setCidades] = useState(cidadesIniciais)
  const [novoNome, setNovoNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  async function handleAdicionar() {
    if (!novoNome.trim()) return
    setEnviando(true)
    setErro(null)
    try {
      const criada = await criarCidade(novoNome.trim())
      setCidades((prev) =>
        [...prev, { id: criada.id, nome: novoNome.trim(), slug: criada.slug, totalBairros: 0, totalEstabelecimentos: 0 }].sort(
          (a, b) => a.nome.localeCompare(b.nome)
        )
      )
      setNovoNome('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar cidade')
    } finally {
      setEnviando(false)
    }
  }

  function iniciarEdicao(cidade: CidadeComContagem) {
    setEditandoId(cidade.id)
    setNomeEdicao(cidade.nome)
  }

  async function salvarEdicao(cidade: CidadeComContagem) {
    if (!nomeEdicao.trim()) return
    setSalvandoEdicao(true)
    try {
      await editarCidade(cidade.id, nomeEdicao.trim())
      setCidades((prev) => prev.map((c) => (c.id === cidade.id ? { ...c, nome: nomeEdicao.trim() } : c)))
      setEditandoId(null)
    } catch (err) {
      alert(`Não foi possível salvar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function handleRemover(cidade: CidadeComContagem) {
    const emUso = cidade.totalBairros + cidade.totalEstabelecimentos
    if (emUso > 0) {
      alert(
        `"${cidade.nome}" tem ${cidade.totalBairros} bairro(s) e ${cidade.totalEstabelecimentos} estabelecimento(s) vinculados — desvincule antes de remover.`
      )
      return
    }
    if (!confirm(`Remover "${cidade.nome}" da cobertura?`)) return

    const anterior = cidades
    setCidades((prev) => prev.filter((c) => c.id !== cidade.id))
    try {
      await removerCidade(cidade.id)
    } catch (err) {
      setCidades(anterior)
      alert(`Não foi possível remover: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
          Nome da cidade
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Camaçari"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          {novoNome.trim() && <span className="text-xs text-neutral-400">slug: {gerarSlug(novoNome)}</span>}
        </label>
        <button
          onClick={handleAdicionar}
          disabled={enviando || !novoNome.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? 'Adicionando...' : '+ Adicionar cidade'}
        </button>
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Bairros</th>
              <th className="px-4 py-2">Estabelecimentos</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {cidades.map((c) => {
              const emEdicao = editandoId === c.id
              return (
                <tr key={c.id}>
                  {emEdicao ? (
                    <>
                      <td className="px-4 py-2" colSpan={2}>
                        <input
                          value={nomeEdicao}
                          onChange={(e) => setNomeEdicao(e.target.value)}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-1"
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-2 text-neutral-600">{c.totalBairros}</td>
                      <td className="px-4 py-2 text-neutral-600">{c.totalEstabelecimentos}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => salvarEdicao(c)}
                          disabled={salvandoEdicao || !nomeEdicao.trim()}
                          className="mr-2 rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button onClick={() => setEditandoId(null)} className="text-xs text-neutral-500 hover:underline">
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-neutral-900">{c.nome}</td>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-500">{c.slug}</td>
                      <td className="px-4 py-2 text-neutral-600">{c.totalBairros}</td>
                      <td className="px-4 py-2 text-neutral-600">{c.totalEstabelecimentos}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button onClick={() => iniciarEdicao(c)} className="mr-3 text-xs text-neutral-500 hover:underline">
                          Editar
                        </button>
                        <button onClick={() => handleRemover(c)} className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
            {cidades.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Nenhuma cidade cadastrada ainda — o cadastro por CNPJ fica bloqueado até ter pelo menos uma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
