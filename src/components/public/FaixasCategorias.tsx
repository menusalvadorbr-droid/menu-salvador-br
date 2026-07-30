'use client'

import { useState } from 'react'
import { Texto } from './TraducaoCardapio'
import ItemCatalogoCard from './ItemCatalogoCard'
import ItemListaLinha from './ItemListaLinha'
import { buscarItensCategoriaPublica } from '@/app/(public)/cardapio/[slug]/buscarItensCategoria'
import type { ItemCardapioBruto } from '@/lib/resolverItemCardapio'

interface CategoriaFaixa {
  id: string
  nome: string
}

interface FaixasCategoriasProps {
  categorias: CategoriaFaixa[]
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
 * Alternativa à navegação em pílulas (NavegacaoCategorias.tsx) — cada
 * categoria vira uma faixa que expande ao tocar, mostrando os itens no
 * formato já escolhido (Lista ou Catálogo, independente dessa escolha de
 * navegação). Os itens de uma categoria só são buscados na hora em que a
 * faixa é aberta pela primeira vez (fica em cache no estado depois disso)
 * — diferente da navegação em pílulas, que já chega com tudo carregado.
 * Só uma faixa fica aberta por vez: abrir uma fecha a anterior, porque só
 * existe um id guardado em `abertaId`.
 */
export default function FaixasCategorias({
  categorias,
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
}: FaixasCategoriasProps) {
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [itensPorCategoria, setItensPorCategoria] = useState<Record<string, ItemCardapioBruto[]>>({})
  const [carregandoId, setCarregandoId] = useState<string | null>(null)

  async function alternar(categoriaId: string) {
    if (abertaId === categoriaId) {
      setAbertaId(null)
      return
    }
    setAbertaId(categoriaId)
    if (itensPorCategoria[categoriaId]) return

    setCarregandoId(categoriaId)
    const itens = await buscarItensCategoriaPublica(categoriaId)
    setItensPorCategoria((prev) => ({ ...prev, [categoriaId]: itens }))
    setCarregandoId(null)
  }

  return (
    <div className="space-y-3">
      {categorias.map((cat) => {
        const aberta = abertaId === cat.id
        const itens = itensPorCategoria[cat.id] || []
        return (
          <div
            key={cat.id}
            id={`cat-${cat.id}`}
            className="scroll-mt-32 overflow-hidden rounded-2xl shadow"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}
          >
            <button
              type="button"
              onClick={() => alternar(cat.id)}
              aria-expanded={aberta}
              className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <h2 className="text-base font-semibold" style={{ color: corP }}>
                <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
              </h2>
              <span
                aria-hidden
                className="flex-shrink-0 text-lg font-bold transition-transform"
                style={{ color: corP, transform: aberta ? 'rotate(180deg)' : undefined }}
              >
                ⌄
              </span>
            </button>

            {aberta && (
              <div className="border-t" style={{ borderColor: corBd }}>
                {carregandoId === cat.id ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm opacity-60" style={{ color: corT }}>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Carregando…
                  </div>
                ) : itens.length === 0 ? (
                  <div className="p-8 text-center text-sm opacity-60" style={{ color: corT }}>
                    Nenhum item disponível nessa categoria.
                  </div>
                ) : layoutCardapio === 'catalogo' ? (
                  <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">
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
                ) : (
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
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
