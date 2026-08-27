'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import FornecedoresManager from '@/modules/fornecedores/components/FornecedoresManager'
import ListaPedidosCompra from '@/modules/fornecedores/components/ListaPedidosCompra'
import GestaoNav from '../gerenciar/GestaoNav'
import AbasPainel from '../gerenciar/AbasPainel'
import EstadoCarregamento from '../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../gerenciar/useEstabelecimentoGerenciar'

const ABAS = [
  { chave: 'pedidos' as const, label: 'Pedidos de compra' },
  { chave: 'fornecedores' as const, label: 'Fornecedores' },
]

export default function FornecedoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aba, setAba] = useState<'pedidos' | 'fornecedores'>('pedidos')
  const { estabelecimento, loading, acessoNegado } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
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

        <AbasPainel abas={ABAS} ativa={aba} onChange={setAba} />

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
