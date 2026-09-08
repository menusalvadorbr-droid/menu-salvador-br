'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import { atualizarCategoria, criarCategoria, excluirCategoria, reordenarCategorias } from '../categoriaRepository'
import { podeUsar } from '../permissoes'
import type { CardapioV2Categoria } from '../types'

export default function CategoriaManager({
  estabelecimento,
  cardapioId,
  categorias,
  categoriaSelecionadaId,
  onSelecionar,
  onMudou,
}: {
  estabelecimento: { id: string }
  cardapioId: string
  categorias: CardapioV2Categoria[]
  categoriaSelecionadaId: string | null
  onSelecionar: (id: string) => void
  onMudou: () => void
}) {
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CardapioV2Categoria | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function handleCriar() {
    if (!novoNome.trim() || !podeUsar(estabelecimento, 'cardapio_v2.categorias.criar')) return
    setSalvando(true)
    try {
      const criada = await criarCategoria(cardapioId, novoNome.trim())
      setNovoNome('')
      onMudou()
      onSelecionar(criada.id)
    } finally {
      setSalvando(false)
    }
  }

  async function handleMover(index: number, direcao: -1 | 1) {
    const alvo = categorias[index + direcao]
    const atual = categorias[index]
    if (!alvo) return
    await reordenarCategorias({ id: atual.id, ordem: atual.ordem }, { id: alvo.id, ordem: alvo.ordem })
    onMudou()
  }

  async function handleExcluir(id: string) {
    setExcluindo(true)
    await excluirCategoria(id)
    setExcluindo(false)
    setCategoriaParaExcluir(null)
    onMudou()
  }

  return (
    <div className="flex flex-col gap-2">
      {categorias.map((cat, index) => (
        <div
          key={cat.id}
          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
            cat.id === categoriaSelecionadaId ? 'border-orange-400 bg-orange-50' : 'border-neutral-200 bg-white'
          }`}
        >
          <button
            className={`flex-1 truncate text-left font-medium ${cat.ativo ? 'text-neutral-800' : 'text-neutral-400 line-through'}`}
            onClick={() => onSelecionar(cat.id)}
          >
            {cat.nome}
          </button>
          <div className="flex shrink-0 items-center gap-1 text-neutral-400">
            <button title="Subir" disabled={index === 0} onClick={() => handleMover(index, -1)} className="disabled:opacity-30">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button title="Descer" disabled={index === categorias.length - 1} onClick={() => handleMover(index, 1)} className="disabled:opacity-30">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              title={cat.ativo ? 'Ocultar categoria' : 'Reativar categoria'}
              onClick={() => atualizarCategoria(cat.id, { ativo: !cat.ativo }).then(onMudou)}
              className="text-xs font-medium underline"
            >
              {cat.ativo ? 'ocultar' : 'ativar'}
            </button>
            <button title="Excluir" onClick={() => setCategoriaParaExcluir(cat)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      <div className="mt-1 flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCriar()}
          placeholder="Nova categoria"
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
        />
        <button
          onClick={handleCriar}
          disabled={salvando || !novoNome.trim()}
          className="flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>

      {categoriaParaExcluir && (
        <ConfirmarAcaoModal
          titulo="Excluir categoria?"
          descricao={`Excluir "${categoriaParaExcluir.nome}" e todos os itens dela?`}
          confirmarLabel="Excluir"
          tom="perigo"
          enviando={excluindo}
          onCancelar={() => setCategoriaParaExcluir(null)}
          onConfirmar={() => handleExcluir(categoriaParaExcluir.id)}
        />
      )}
    </div>
  )
}
