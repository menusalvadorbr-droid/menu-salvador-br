'use client'

import { useCarrinho } from './CarrinhoProvider'

export default function BotaoAdicionarCarrinho({
  id,
  nome,
  preco,
  precoPromocional,
  corDestaque,
}: {
  id: string
  nome: string
  preco: number
  precoPromocional?: number | null
  corDestaque: string
}) {
  const { adicionarItem } = useCarrinho()

  return (
    <button
      onClick={() =>
        adicionarItem({
          id,
          nome,
          preco,
          preco_promocional: precoPromocional || undefined,
        })
      }
      className="mt-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: corDestaque }}
    >
      + Adicionar
    </button>
  )
}
