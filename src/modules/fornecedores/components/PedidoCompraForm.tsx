'use client'

import { useEffect, useState } from 'react'
import { usePedidosCompra } from '../hooks/usePedidosCompra'
import { useFornecedores } from '../hooks/useFornecedores'
import { listarInsumos } from '@/modules/estoque/estoqueRepository'
import type { Insumo } from '@/modules/estoque/types'
import type { NovoItemPedidoCompra } from '../types'
import { formatarReais } from '@/lib/moeda'

interface LinhaItem extends NovoItemPedidoCompra {
  chave: string
}

export default function PedidoCompraForm({
  estabelecimentoId,
  onCriado,
}: {
  estabelecimentoId: string
  onCriado: () => void
}) {
  const { fornecedores } = useFornecedores(estabelecimentoId)
  const { criar } = usePedidosCompra(estabelecimentoId)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [fornecedorId, setFornecedorId] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<LinhaItem[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    listarInsumos(estabelecimentoId).then(setInsumos)
  }, [estabelecimentoId])

  function adicionarLinha() {
    if (insumos.length === 0) return
    setItens((prev) => [
      ...prev,
      { chave: crypto.randomUUID(), insumoId: insumos[0].id, quantidade: 1, valorUnitario: 0 },
    ])
  }

  function atualizarLinha(chave: string, campo: keyof NovoItemPedidoCompra, valor: string | number) {
    setItens((prev) => prev.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)))
  }

  function removerLinha(chave: string) {
    setItens((prev) => prev.filter((item) => item.chave !== chave))
  }

  const total = itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0)

  async function handleCriar() {
    if (itens.length === 0) {
      alert('Adicione ao menos um item.')
      return
    }
    setEnviando(true)
    const ok = await criar(fornecedorId || null, itens, observacoes || undefined)
    setEnviando(false)
    if (ok) onCriado()
  }

  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Fornecedor
          <select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          >
            <option value="">Sem fornecedor definido</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Observações
          <input
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {itens.map((item) => (
          <div key={item.chave} className="flex flex-wrap items-end gap-2 rounded-lg bg-neutral-50 p-2">
            <select
              value={item.insumoId}
              onChange={(e) => atualizarLinha(item.chave, 'insumoId', e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
            >
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>
              ))}
            </select>
            <input
              type="number"
              value={item.quantidade}
              onChange={(e) => atualizarLinha(item.chave, 'quantidade', Number(e.target.value))}
              placeholder="Qtd"
              className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
            />
            <input
              type="number"
              value={item.valorUnitario}
              onChange={(e) => atualizarLinha(item.chave, 'valorUnitario', Number(e.target.value))}
              placeholder="R$ unitário"
              className="w-24 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
            />
            <button onClick={() => removerLinha(item.chave)} className="text-xs text-red-500 hover:underline">
              Remover
            </button>
          </div>
        ))}

        <button
          onClick={adicionarLinha}
          disabled={insumos.length === 0}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-40"
        >
          + Adicionar item
        </button>
        {insumos.length === 0 && (
          <p className="text-xs text-neutral-400">Cadastre insumos na aba Estoque antes de criar um pedido de compra.</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <span className="text-sm font-semibold text-neutral-700">Total: R$ {formatarReais(total)}</span>
        <button
          onClick={handleCriar}
          disabled={enviando || itens.length === 0}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {enviando ? 'Criando...' : 'Criar pedido de compra'}
        </button>
      </div>
    </div>
  )
}
