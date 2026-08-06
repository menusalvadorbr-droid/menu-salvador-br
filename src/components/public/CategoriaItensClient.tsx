'use client'

import { useEffect } from 'react'
import { TextoInterface } from './TraducaoCardapio'
import ItemCatalogoCard from './ItemCatalogoCard'
import ItemListaLinha from './ItemListaLinha'
import { useCardapioPublico } from './useCardapioPublico'

interface CategoriaItensClientProps {
  estabelecimentoId: string
  categoriaId: string
  layoutCardapio: 'lista' | 'catalogo'
  corP: string
  corT: string
  corS: string
  corBd: string
  cardRaio: string
  mostrarCodigo: boolean
  mostrarAlergenos: boolean
  fotoPosicao: 'left' | 'right' | 'top' | 'none'
  cliqueExpandeAtivado: boolean
  carrinhoAtivado: boolean
}

/**
 * Lista de itens da página de categoria (navegação em Cards) — client
 * component pra poder usar useCardapioPublico (cache persistente +
 * Realtime). Diferente das outras duas páginas: aqui os itens NÃO vêm
 * mais prontos do servidor (essa página nunca tinha cache nenhum antes;
 * agora, na primeira visita a uma categoria, o custo é o mesmo fetch que
 * já existia, só que do cliente — e visitas seguintes, mesmo em outra
 * aba/dia, reaproveitam o cache local sem bater no banco de novo).
 */
export default function CategoriaItensClient({
  estabelecimentoId,
  categoriaId,
  layoutCardapio,
  corP,
  corT,
  corS,
  corBd,
  cardRaio,
  mostrarCodigo,
  mostrarAlergenos,
  fotoPosicao,
  cliqueExpandeAtivado,
  carrinhoAtivado,
}: CategoriaItensClientProps) {
  const { itensPorCategoria, garantirCategoria } = useCardapioPublico({ estabelecimentoId })

  useEffect(() => {
    garantirCategoria(categoriaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaId])

  // A chave só existe depois que garantirCategoria termina (mesmo pra
  // categoria vazia, ele grava um array vazio) — usa isso pra distinguir
  // "ainda carregando" de "carregou e não tem item nenhum".
  const carregado = categoriaId in itensPorCategoria
  const itens = itensPorCategoria[categoriaId] || []

  if (!carregado) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl p-12 text-sm opacity-60 shadow" style={{ backgroundColor: corS, color: corT }}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Carregando…
      </div>
    )
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center shadow" style={{ backgroundColor: corS }}>
        <p className="text-lg font-medium"><TextoInterface chave="nenhum_item_disponivel">Nenhum item disponível</TextoInterface></p>
        <p className="text-sm opacity-60 mt-1"><TextoInterface chave="volte_em_breve">Volte em breve!</TextoInterface></p>
      </div>
    )
  }

  if (layoutCardapio === 'catalogo') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {itens.map((item) => (
          <ItemCatalogoCard
            key={item.id}
            item={item}
            corP={corP} corT={corT} corS={corS} corBd={corBd}
            cardRaio={cardRaio}
            mostrarAlergenos={mostrarAlergenos}
            cliqueExpandeAtivado={cliqueExpandeAtivado}
            carrinhoAtivado={carrinhoAtivado}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow divide-y" style={{ backgroundColor: corS, borderColor: corBd }}>
      {itens.map((item) => (
        <ItemListaLinha
          key={item.id}
          item={item}
          corP={corP} corT={corT} corS={corS} corBd={corBd}
          mostrarCodigo={mostrarCodigo}
          mostrarAlergenos={mostrarAlergenos}
          fotoPosicao={fotoPosicao}
          cliqueExpandeAtivado={cliqueExpandeAtivado}
          carrinhoAtivado={carrinhoAtivado}
        />
      ))}
    </div>
  )
}
