'use client'

import { useState } from 'react'
import { useCarrinho } from './CarrinhoProvider'
import SeletorItemModal from './SeletorItemModal'
import type { GrupoResolvido, VariacaoResolvida } from './tiposSelecao'

export default function BotaoAdicionarCarrinho({
  id,
  nome,
  preco,
  precoPromocional,
  corDestaque,
  variacoes = [],
  grupos = [],
}: {
  id: string
  nome: string
  preco: number
  precoPromocional?: number | null
  corDestaque: string
  variacoes?: VariacaoResolvida[]
  grupos?: GrupoResolvido[]
}) {
  const { adicionarItem } = useCarrinho()
  const [seletorAberto, setSeletorAberto] = useState(false)
  // Item com tamanho e/ou complemento não pode ir direto pro carrinho —
  // precisa passar pelo seletor pra escolher (e validar) antes.
  const precisaSeletor = variacoes.length > 0 || grupos.length > 0

  function handleClick() {
    if (precisaSeletor) {
      setSeletorAberto(true)
      return
    }
    adicionarItem({ id, nome, preco, preco_promocional: precoPromocional || undefined })
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="mt-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90"
        style={{ backgroundColor: corDestaque }}
      >
        + Adicionar
      </button>

      {seletorAberto && (
        <SeletorItemModal
          nome={nome}
          precoBase={preco}
          precoPromocionalBase={precoPromocional}
          variacoes={variacoes}
          grupos={grupos}
          corDestaque={corDestaque}
          onFechar={() => setSeletorAberto(false)}
          onConfirmar={(selecao) => {
            adicionarItem({
              id,
              nome,
              preco: selecao.preco,
              variacao: selecao.variacao,
              complementos: selecao.complementos,
            })
            setSeletorAberto(false)
          }}
        />
      )}
    </>
  )
}
