'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import InsumosManager from '@/modules/estoque/components/InsumosManager'
import FichaTecnicaManager from '@/modules/estoque/components/FichaTecnicaManager'
import MovimentosManager from '@/modules/estoque/components/MovimentosManager'
import GestaoNav from '../gerenciar/GestaoNav'

export default function EstoquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aba, setAba] = useState<'insumos' | 'fichas' | 'movimentos'>('insumos')

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/painel/estabelecimento/${id}/gerenciar`}
          className="text-sm text-neutral-500 hover:text-orange-600"
        >
          ← Voltar ao gerenciamento
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Estoque</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cadastre os insumos e monte a ficha técnica de cada prato — o estoque desconta sozinho quando
          um pedido entra em preparo.
        </p>
        <GestaoNav estabelecimentoId={id} />

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setAba('insumos')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'insumos' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Insumos
          </button>
          <button
            onClick={() => setAba('fichas')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'fichas' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Fichas técnicas
          </button>
          <button
            onClick={() => setAba('movimentos')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              aba === 'movimentos' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Movimentos
          </button>
        </div>

        <div className="mt-6">
          {aba === 'insumos' && <InsumosManager estabelecimentoId={id} />}
          {aba === 'fichas' && <FichaTecnicaManager estabelecimentoId={id} />}
          {aba === 'movimentos' && <MovimentosManager estabelecimentoId={id} />}
        </div>
      </div>
    </div>
  )
}
