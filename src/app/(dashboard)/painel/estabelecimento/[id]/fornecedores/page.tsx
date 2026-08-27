'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import FornecedoresManager from '@/modules/fornecedores/components/FornecedoresManager'
import ListaPedidosCompra from '@/modules/fornecedores/components/ListaPedidosCompra'
import GestaoNav from '../gerenciar/GestaoNav'

export default function FornecedoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aba, setAba] = useState<'pedidos' | 'fornecedores'>('pedidos')

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/painel/estabelecimento/${id}/gerenciar`}
          className="text-sm text-neutral-500 hover:text-orange-600"
        >
          ← Voltar ao gerenciamento
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Fornecedores e Compras</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Receber um pedido dá entrada automática no estoque, na aba Estoque.
        </p>
        <GestaoNav estabelecimentoId={id} />

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAba('pedidos')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'pedidos' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Pedidos de compra
          </button>
          <button
            onClick={() => setAba('fornecedores')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'fornecedores' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Fornecedores
          </button>
        </div>

        <div className="mt-6">
          {aba === 'pedidos' ? (
            <ListaPedidosCompra estabelecimentoId={id} />
          ) : (
            <FornecedoresManager estabelecimentoId={id} />
          )}
        </div>
      </div>
    </div>
  )
}
