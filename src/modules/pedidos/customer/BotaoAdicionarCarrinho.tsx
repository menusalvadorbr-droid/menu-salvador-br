'use client'

import { useState } from 'react'
import { useCarrinho } from './CarrinhoProvider'
import SeletorItemModal from './SeletorItemModal'
import type { GrupoResolvido, VariacaoResolvida } from './tiposSelecao'
import { useTraducao } from '@/components/public/TraducaoCardapio'

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
  const { itens, adicionarItem, alterarQuantidade, removerItem } = useCarrinho()
  const { traduzirInterface } = useTraducao()
  const [seletorAberto, setSeletorAberto] = useState(false)
  // Item com tamanho e/ou complemento não pode ir direto pro carrinho —
  // precisa passar pelo seletor pra escolher (e validar) antes.
  const precisaSeletor = variacoes.length > 0 || grupos.length > 0

  // Soma todas as linhas desse item na sacola — item simples só tem uma
  // linha possível (linhaId === id); item com variação/complemento pode ter
  // várias (customizações diferentes), por isso soma em vez de indexar uma
  // linha só.
  const linhasDoItem = itens.filter((i) => i.id === id)
  const quantidadeTotal = linhasDoItem.reduce((soma, i) => soma + i.quantidade, 0)

  function handleClick() {
    if (precisaSeletor) {
      setSeletorAberto(true)
      return
    }
    adicionarItem({ id, nome, preco, preco_promocional: precoPromocional || undefined })
  }

  // Item simples (sem seletor) com pelo menos 1 unidade já na sacola: o
  // botão vira um contador −/qtd/+ em vez de continuar "+ Adicionar" —
  // padrão de app de delivery (iFood/Uber Eats), confirma visualmente que o
  // clique surtiu efeito sem precisar abrir a sacola pra conferir.
  if (!precisaSeletor && quantidadeTotal > 0) {
    const linha = linhasDoItem[0]
    const linhaId = linha.linhaId || linha.id

    function decrementar() {
      // alterarQuantidade nunca deixa a quantidade chegar a zero (trava em
      // 1, ver useSacola.ts) — abaixo de 1 tem que ser removerItem mesmo,
      // senão o botão nunca volta a virar "+ Adicionar".
      if (quantidadeTotal <= 1) removerItem(linhaId)
      else alterarQuantidade(linhaId, -1)
    }

    return (
      <div className="mt-1 flex items-center gap-3 rounded-lg px-1 py-1" style={{ backgroundColor: corDestaque }}>
        <button
          type="button"
          onClick={decrementar}
          aria-label={traduzirInterface('diminuir_quantidade', 'Diminuir quantidade')}
          className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-white transition active:scale-90"
        >
          −
        </button>
        <span className="min-w-[1ch] text-center text-xs font-bold text-white">{quantidadeTotal}</span>
        <button
          type="button"
          onClick={() => adicionarItem({ id, nome, preco, preco_promocional: precoPromocional || undefined })}
          aria-label={traduzirInterface('aumentar_quantidade', 'Aumentar quantidade')}
          className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-white transition active:scale-90"
        >
          +
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="relative mt-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
        style={{ backgroundColor: corDestaque }}
      >
        + {traduzirInterface('adicionar', 'Adicionar')}
        {/* Item com seletor pode ter várias linhas (customizações
            diferentes) — mostra o total como selo em vez de virar contador,
            já que "+" sempre reabre o seletor pra uma nova customização. */}
        {precisaSeletor && quantidadeTotal > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold"
            style={{ color: corDestaque }}
          >
            {quantidadeTotal}
          </span>
        )}
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
