'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import InsumosManager from '@/modules/estoque/components/InsumosManager'
import FichaTecnicaManager from '@/modules/estoque/components/FichaTecnicaManager'
import MovimentosManager from '@/modules/estoque/components/MovimentosManager'
import GestaoNav from '../gerenciar/GestaoNav'
import AbasPainel from '../gerenciar/AbasPainel'
import EstadoCarregamento from '../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../gerenciar/useEstabelecimentoGerenciar'

const ABAS = [
  { chave: 'insumos' as const, label: 'Insumos' },
  { chave: 'fichas' as const, label: 'Fichas técnicas' },
  { chave: 'movimentos' as const, label: 'Movimentos' },
]

export default function EstoquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [aba, setAba] = useState<'insumos' | 'fichas' | 'movimentos'>('insumos')
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
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Estoque</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Cadastre os insumos e monte a ficha técnica de cada prato — o estoque desconta sozinho quando
          um pedido entra em preparo.
        </p>
        <GestaoNav estabelecimentoId={id} />

        <AbasPainel abas={ABAS} ativa={aba} onChange={setAba} />

        <div className="mt-6">
          {aba === 'insumos' && <InsumosManager estabelecimentoId={id} />}
          {aba === 'fichas' && <FichaTecnicaManager estabelecimentoId={id} />}
          {aba === 'movimentos' && <MovimentosManager estabelecimentoId={id} />}
        </div>
      </div>
    </div>
  )
}
