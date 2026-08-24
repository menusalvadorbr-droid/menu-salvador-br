'use client'

import { useState, useMemo, Fragment } from 'react'
import { gerarSlug } from '@/lib/slug'
import { criarBairro, editarBairro, removerBairro } from './actions'
import EmojiPicker from '../../components/EmojiPicker'

export interface BairroComContagem {
  id: string
  nome: string
  slug: string
  icone?: string | null
  cidade_id: string | null
  totalEstabelecimentos: number
}

interface BairrosManagerProps {
  bairrosIniciais: BairroComContagem[]
  cidades: { id: string; nome: string }[]
}

export default function BairrosManager({ bairrosIniciais, cidades }: BairrosManagerProps) {
  const [bairros, setBairros] = useState(bairrosIniciais)
  const [novoNome, setNovoNome] = useState('')
  const [novoIcone, setNovoIcone] = useState('')
  const [novaCidadeId, setNovaCidadeId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [iconeEdicao, setIconeEdicao] = useState('')
  const [cidadeIdEdicao, setCidadeIdEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  function nomeCidade(cidadeId: string | null) {
    return cidades.find((c) => c.id === cidadeId)?.nome || '—'
  }

  // Agrupado por cidade em vez de uma lista alfabética só — antes a
  // cidade só aparecia como coluna, sem nenhuma organização visual entre
  // as 9 cidades já cadastradas.
  const gruposPorCidade = useMemo(() => {
    const mapa = new Map<string, BairroComContagem[]>()
    for (const b of bairros) {
      const chave = b.cidade_id || 'sem-cidade'
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(b)
    }
    return Array.from(mapa.entries())
      .map(([cidadeId, lista]) => ({
        cidadeId,
        nome: cidades.find((c) => c.id === cidadeId)?.nome || 'Sem cidade',
        bairros: [...lista].sort((a, c) => a.nome.localeCompare(c.nome)),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [bairros, cidades])

  async function handleAdicionar() {
    if (!novoNome.trim() || !novaCidadeId) return
    setEnviando(true)
    setErro(null)
    try {
      await criarBairro(novoNome.trim(), novoIcone.trim(), novaCidadeId)
      setBairros((prev) =>
        [
          ...prev,
          {
            id: crypto.randomUUID(),
            nome: novoNome.trim(),
            slug: gerarSlug(novoNome),
            icone: novoIcone.trim() || null,
            cidade_id: novaCidadeId,
            totalEstabelecimentos: 0,
          },
        ].sort((a, b) => a.nome.localeCompare(b.nome))
      )
      setNovoNome('')
      setNovoIcone('')
      setNovaCidadeId('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar bairro')
    } finally {
      setEnviando(false)
    }
  }

  function iniciarEdicao(bairro: BairroComContagem) {
    setEditandoId(bairro.id)
    setNomeEdicao(bairro.nome)
    setIconeEdicao(bairro.icone || '')
    setCidadeIdEdicao(bairro.cidade_id || '')
  }

  async function salvarEdicao(bairro: BairroComContagem) {
    if (!nomeEdicao.trim() || !cidadeIdEdicao) return
    setSalvandoEdicao(true)
    try {
      await editarBairro(bairro.id, nomeEdicao.trim(), iconeEdicao.trim(), cidadeIdEdicao)
      setBairros((prev) =>
        prev.map((b) =>
          b.id === bairro.id ? { ...b, nome: nomeEdicao.trim(), icone: iconeEdicao.trim() || null, cidade_id: cidadeIdEdicao } : b
        )
      )
      setEditandoId(null)
    } catch (err) {
      alert(`Não foi possível salvar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function handleRemover(bairro: BairroComContagem) {
    if (bairro.totalEstabelecimentos > 0) {
      const confirmar = confirm(
        `${bairro.totalEstabelecimentos} estabelecimento(s) usam "${bairro.nome}". Removendo o bairro, eles ficam sem bairro definido até o dono escolher outro. Continuar?`
      )
      if (!confirmar) return
    } else if (!confirm(`Remover "${bairro.nome}"?`)) {
      return
    }

    const anterior = bairros
    setBairros((prev) => prev.filter((b) => b.id !== bairro.id))
    try {
      await removerBairro(bairro.id)
    } catch (err) {
      setBairros(anterior)
      alert(`Não foi possível remover: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Ícone
          <EmojiPicker value={novoIcone} onChange={setNovoIcone} />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
          Nome do bairro
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Ex: Santo Antônio"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
          {novoNome.trim() && (
            <span className="text-xs text-neutral-400">URL: /{gerarSlug(novoNome)}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Cidade
          <select
            value={novaCidadeId}
            onChange={(e) => setNovaCidadeId(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Selecione</option>
            {cidades.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        <button
          onClick={handleAdicionar}
          disabled={enviando || !novoNome.trim() || !novaCidadeId}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? 'Adicionando...' : '+ Adicionar bairro'}
        </button>
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">URL (slug)</th>
              <th className="px-4 py-2">Cidade</th>
              <th className="px-4 py-2">Estabelecimentos</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {gruposPorCidade.map((grupo) => (
              <Fragment key={grupo.cidadeId}>
                <tr className="bg-neutral-50">
                  <td colSpan={6} className="px-4 py-1.5 text-xs font-semibold uppercase text-neutral-500">
                    {grupo.nome} <span className="font-normal text-neutral-400">({grupo.bairros.length})</span>
                  </td>
                </tr>
                {grupo.bairros.map((b) => {
                  const emEdicao = editandoId === b.id
                  return (
                    <tr key={b.id}>
                      {emEdicao ? (
                        <>
                          <td className="px-4 py-2">
                            <EmojiPicker value={iconeEdicao} onChange={setIconeEdicao} />
                          </td>
                          <td className="px-4 py-2" colSpan={2}>
                            <input
                              value={nomeEdicao}
                              onChange={(e) => setNomeEdicao(e.target.value)}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-1"
                              autoFocus
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={cidadeIdEdicao}
                              onChange={(e) => setCidadeIdEdicao(e.target.value)}
                              className="rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                            >
                              <option value="">Selecione</option>
                              {cidades.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-neutral-600">{b.totalEstabelecimentos}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => salvarEdicao(b)}
                              disabled={salvandoEdicao || !nomeEdicao.trim() || !cidadeIdEdicao}
                              className="mr-2 rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              className="text-xs text-neutral-500 hover:underline"
                            >
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 text-lg">{b.icone || '📍'}</td>
                          <td className="px-4 py-2 text-neutral-900">{b.nome}</td>
                          <td className="px-4 py-2 font-mono text-xs text-neutral-500">/{b.slug}</td>
                          <td className="px-4 py-2 text-neutral-600">{nomeCidade(b.cidade_id)}</td>
                          <td className="px-4 py-2 text-neutral-600">{b.totalEstabelecimentos}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <button onClick={() => iniciarEdicao(b)} className="mr-3 text-xs text-neutral-500 hover:underline">
                              Editar
                            </button>
                            <button onClick={() => handleRemover(b)} className="text-xs text-red-500 hover:underline">
                              Remover
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
            {bairros.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-400">
                  Nenhum bairro cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
