'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { CardapioV2VariacaoInput } from '../types'

/** Editor controlado (sem gravar sozinho — o array final vai junto no
 * salvarItem() transacional). Preço aqui é do tamanho em si (ex: "Grande"
 * = R$ 32), não um adicional. */
export default function VariacaoEditor({
  variacoes,
  onChange,
}: {
  variacoes: CardapioV2VariacaoInput[]
  onChange: (variacoes: CardapioV2VariacaoInput[]) => void
}) {
  function atualizar(index: number, campo: keyof CardapioV2VariacaoInput, valor: string) {
    const copia = [...variacoes]
    copia[index] = { ...copia[index], [campo]: campo === 'preco' ? Number(valor) : valor }
    onChange(copia)
  }

  function adicionar() {
    onChange([...variacoes, { nome: '', preco: 0, ordem: variacoes.length }])
  }

  function remover(index: number) {
    onChange(variacoes.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">Variações de tamanho/preço</label>
      <div className="flex flex-col gap-1.5">
        {variacoes.map((v, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={v.nome}
              onChange={(e) => atualizar(index, 'nome', e.target.value)}
              placeholder="Ex: Grande"
              className="flex-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={v.preco}
              onChange={(e) => atualizar(index, 'preco', e.target.value)}
              placeholder="Preço"
              className="w-28 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-sm"
            />
            <button type="button" onClick={() => remover(index)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={adicionar}
        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-600"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar variação
      </button>
    </div>
  )
}
