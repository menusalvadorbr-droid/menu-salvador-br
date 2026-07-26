'use client'

import { useEffect, useState } from 'react'
import {
  listarItensCardapioSimples,
  listarInsumos,
  listarReceita,
  salvarItemReceita,
  removerItemReceita,
} from '../estoqueRepository'
import type { Insumo, ItemReceita } from '../types'

interface ItemCardapioSimples {
  id: string
  nome: string
  categoria: string
}

export default function ReceitaEditor({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [itens, setItens] = useState<ItemCardapioSimples[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [itemSelecionado, setItemSelecionado] = useState<ItemCardapioSimples | null>(null)
  const [receita, setReceita] = useState<ItemReceita[]>([])
  const [insumoNovo, setInsumoNovo] = useState('')
  const [quantidadeNova, setQuantidadeNova] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    Promise.all([listarItensCardapioSimples(estabelecimentoId), listarInsumos(estabelecimentoId)])
      .then(([itensCardapio, insumosCarregados]) => {
        setItens(itensCardapio)
        setInsumos(insumosCarregados)
      })
      .catch((err) => {
        alert(`Erro ao carregar dados: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
      })
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  async function selecionarItem(item: ItemCardapioSimples) {
    setItemSelecionado(item)
    try {
      setReceita(await listarReceita(item.id))
    } catch (err) {
      alert(`Erro ao carregar receita: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function adicionarInsumoNaReceita() {
    if (!itemSelecionado || !insumoNovo || !quantidadeNova) return
    try {
      await salvarItemReceita(itemSelecionado.id, insumoNovo, Number(quantidadeNova))
      setReceita(await listarReceita(itemSelecionado.id))
      setInsumoNovo('')
      setQuantidadeNova('')
    } catch (err) {
      alert(`Erro ao vincular insumo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function removerDaReceita(receitaId: string) {
    try {
      await removerItemReceita(receitaId)
      if (itemSelecionado) setReceita(await listarReceita(itemSelecionado.id))
    } catch (err) {
      alert(`Erro ao remover: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando cardápio...</div>
  }

  if (insumos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
        Cadastre insumos primeiro para poder montar as receitas dos itens do cardápio.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-neutral-700">Itens do cardápio</h3>
        <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
          {itens.map((item) => (
            <button
              key={item.id}
              onClick={() => selecionarItem(item)}
              className={`rounded-lg px-3 py-2 text-left text-sm ${
                itemSelecionado?.id === item.id
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {item.nome}
              <span className="ml-1 text-xs text-neutral-400">· {item.categoria}</span>
            </button>
          ))}
          {itens.length === 0 && (
            <p className="py-4 text-center text-sm text-neutral-400">Nenhum item de cardápio cadastrado.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-neutral-700">
          {itemSelecionado ? `Receita — ${itemSelecionado.nome}` : 'Selecione um item ao lado'}
        </h3>

        {itemSelecionado && (
          <>
            <div className="mb-3 flex flex-col gap-2">
              {receita.map((linha) => (
                <div key={linha.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                  <span>
                    {linha.quantidade_usada} {linha.insumo?.unidade} de {linha.insumo?.nome}
                  </span>
                  <button onClick={() => removerDaReceita(linha.id)} className="text-xs text-red-500 hover:underline">
                    Remover
                  </button>
                </div>
              ))}
              {receita.length === 0 && (
                <p className="text-sm text-neutral-400">Nenhum insumo vinculado ainda.</p>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
              <select
                value={insumoNovo}
                onChange={(e) => setInsumoNovo(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
              >
                <option value="">Insumo...</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={quantidadeNova}
                onChange={(e) => setQuantidadeNova(e.target.value)}
                placeholder="Qtd"
                className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
              />
              <button
                onClick={adicionarInsumoNaReceita}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
              >
                Vincular
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
