'use client'

import { useCardapioPublico, type DadosIniciaisServidor } from './useCardapioPublico'
import { Texto } from './TraducaoCardapio'
import ItemCatalogoCard from './ItemCatalogoCard'
import ItemListaLinha from './ItemListaLinha'

interface PilulasCardapioClientProps {
  estabelecimentoId: string
  dadosIniciaisServidor: DadosIniciaisServidor
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
 * Renderização da navegação em Pílulas — mesma lista de sempre, agora
 * dirigida pelo cache persistente + Realtime (useCardapioPublico, modo
 * eager: já chega com tudo do servidor via dadosIniciaisServidor, o SSR
 * deste request não muda em nada pra SEO/primeira pintura; o que muda é
 * o que acontece DEPOIS — cache local pra próxima visita e atualização
 * ao vivo enquanto a aba fica aberta).
 */
export default function PilulasCardapioClient({
  estabelecimentoId,
  dadosIniciaisServidor,
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
}: PilulasCardapioClientProps) {
  const { categorias, itensPorCategoria } = useCardapioPublico({
    estabelecimentoId,
    eager: true,
    dadosIniciaisServidor,
  })

  if (layoutCardapio === 'catalogo') {
    return (
      <div className="space-y-6">
        {categorias.map((cat) => {
          const itens = itensPorCategoria[cat.id] || []
          if (!itens.length) return null
          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32">
              <h2 className="mb-3 text-base font-semibold" style={{ color: corP }}>
                <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
                <span className="ml-2 text-sm font-normal opacity-60">({itens.length})</span>
              </h2>
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
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categorias.map((cat) => {
        const itens = itensPorCategoria[cat.id] || []
        if (!itens.length) return null
        return (
          <div key={cat.id} id={`cat-${cat.id}`}
            className="scroll-mt-32 rounded-2xl overflow-hidden shadow"
            style={{ backgroundColor: corS }}>

            {/* Cabeçalho da categoria */}
            <div className="px-5 py-3 border-b"
              style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
              <h2 className="text-base font-semibold" style={{ color: corP }}>
                <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
                <span className="ml-2 text-sm font-normal opacity-60">({itens.length})</span>
              </h2>
            </div>

            {/* Itens */}
            <div className="divide-y" style={{ borderColor: corBd }}>
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
          </div>
        )
      })}
    </div>
  )
}
