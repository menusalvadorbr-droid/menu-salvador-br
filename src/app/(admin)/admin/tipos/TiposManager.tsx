'use client'

import { useState } from 'react'
import EmojiPicker from '../../components/EmojiPicker'

export interface TipoItem {
  id: number
  nome: string
  slug: string
  icone: string | null
  ativo: boolean
  totalEmUso: number
}

interface TiposManagerProps {
  titulo: string
  descricao: string
  placeholderNome: string
  itensIniciais: TipoItem[]
  onCriar: (nome: string, icone: string) => Promise<void>
  onToggle: (id: number, ativo: boolean) => Promise<void>
  onEditar: (id: number, nome: string, icone: string) => Promise<void>
  onExcluir: (id: number) => Promise<void>
}

export default function TiposManager({
  titulo,
  descricao,
  placeholderNome,
  itensIniciais,
  onCriar,
  onToggle,
  onEditar,
  onExcluir,
}: TiposManagerProps) {
  const [itens, setItens] = useState(itensIniciais)
  const [novoNome, setNovoNome] = useState('')
  const [novoIcone, setNovoIcone] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [iconeEdicao, setIconeEdicao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  async function handleAdicionar() {
    if (!novoNome.trim()) return
    setEnviando(true)
    setErro(null)
    try {
      await onCriar(novoNome.trim(), novoIcone.trim())
      setItens((prev) => [
        ...prev,
        {
          id: Date.now(),
          nome: novoNome.trim(),
          slug: novoNome.trim().toLowerCase(),
          icone: novoIcone.trim() || null,
          ativo: true,
          totalEmUso: 0,
        },
      ])
      setNovoNome('')
      setNovoIcone('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar')
    } finally {
      setEnviando(false)
    }
  }

  async function handleToggle(item: TipoItem) {
    const novoAtivo = !item.ativo
    if (!novoAtivo && item.totalEmUso > 0) {
      const confirmar = confirm(
        `${item.totalEmUso} estabelecimento(s) usam "${item.nome}". Desativando, ele só some da lista pra novos cadastros — quem já usa continua igual. Continuar?`
      )
      if (!confirmar) return
    }

    const anterior = itens
    setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, ativo: novoAtivo } : i)))
    try {
      await onToggle(item.id, novoAtivo)
    } catch (err) {
      setItens(anterior)
      alert(`Não foi possível salvar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  function iniciarEdicao(item: TipoItem) {
    setEditandoId(item.id)
    setNomeEdicao(item.nome)
    setIconeEdicao(item.icone || '')
  }

  async function salvarEdicao(item: TipoItem) {
    if (!nomeEdicao.trim()) return
    setSalvandoEdicao(true)
    try {
      await onEditar(item.id, nomeEdicao.trim(), iconeEdicao.trim())
      setItens((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, nome: nomeEdicao.trim(), icone: iconeEdicao.trim() || null } : i))
      )
      setEditandoId(null)
    } catch (err) {
      alert(`Não foi possível salvar: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function handleExcluir(item: TipoItem) {
    const aviso =
      item.totalEmUso > 0
        ? `${item.totalEmUso} estabelecimento(s) usam "${item.nome}". Excluir aqui não apaga o estabelecimento, mas remove esse vínculo — considere apenas desativar em vez de excluir. Excluir mesmo assim?`
        : `Excluir "${item.nome}"? Não tem como desfazer.`
    if (!confirm(aviso)) return

    const anterior = itens
    setItens((prev) => prev.filter((i) => i.id !== item.id))
    try {
      await onExcluir(item.id)
    } catch (err) {
      setItens(anterior)
      alert(`Não foi possível excluir: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-800">{titulo}</h2>
      <p className="mt-1 text-xs text-neutral-400">{descricao}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Ícone
          <EmojiPicker value={novoIcone} onChange={setNovoIcone} />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-neutral-500">
          Nome
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder={placeholderNome}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
        <button
          onClick={handleAdicionar}
          disabled={enviando || !novoNome.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? 'Adicionando...' : '+ Adicionar'}
        </button>
      </div>

      {erro && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="mt-4 flex flex-col gap-1.5">
        {itens.map((item) => {
          const emEdicao = editandoId === item.id
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2"
            >
              {emEdicao ? (
                <>
                  <EmojiPicker value={iconeEdicao} onChange={setIconeEdicao} />
                  <input
                    value={nomeEdicao}
                    onChange={(e) => setNomeEdicao(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => salvarEdicao(item)}
                    disabled={salvandoEdicao || !nomeEdicao.trim()}
                    className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xl">{item.icone || '🏷️'}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${item.ativo ? 'text-neutral-900' : 'text-neutral-400 line-through'}`}>{item.nome}</p>
                    {item.totalEmUso > 0 && (
                      <p className="text-xs text-neutral-400">{item.totalEmUso} estabelecimento(s) usando</p>
                    )}
                  </div>
                  <button
                    onClick={() => iniciarEdicao(item)}
                    className="text-xs text-neutral-500 hover:text-neutral-800"
                    title="Editar nome/ícone"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleExcluir(item)}
                    className="text-xs text-red-500 hover:text-red-700"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${item.ativo ? 'bg-green-500' : 'bg-neutral-300'}`}
                    aria-pressed={item.ativo}
                    aria-label={`Ativar ou desativar ${item.nome}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${item.ativo ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>
                </>
              )}
            </div>
          )
        })}
        {itens.length === 0 && (
          <p className="py-6 text-center text-sm text-neutral-400">Nenhum tipo cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}
