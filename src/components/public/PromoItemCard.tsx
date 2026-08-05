'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Texto, useTraducao } from './TraducaoCardapio'

interface PromoItemCardProps {
  item: {
    id: string
    nome: string
    descricao?: string | null
    preco: number
    preco_promocional: number
    foto_url: string | null
  }
  corP: string
  corT: string
  corF: string
  corBd: string
  cardRaio: string
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Card de item em promoção no carrossel "Promoções de hoje" — mesma casca
 * visual de antes, mas clicar agora abre um painel expandido (mesmo padrão
 * do SpecialOfferCard/ItemClicavel) em vez de navegar pra categoria.
 */
export default function PromoItemCard({ item, corP, corT, corF, corBd, cardRaio }: PromoItemCardProps) {
  const { traduzirInterface } = useTraducao()
  const [aberto, setAberto] = useState(false)

  const foto = getOptimizedCloudinaryUrl(item.foto_url, 200, 200, 'fill')
  const fotoGrande = getOptimizedCloudinaryUrl(item.foto_url, 700, 450, 'fill')
  const pct = item.preco && item.preco_promocional
    ? Math.round((1 - item.preco_promocional / item.preco) * 100) : 0

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberto(true) } }}
        className="flex-shrink-0 w-32 h-44 overflow-hidden border cursor-pointer hover:shadow-md transition"
        style={{ backgroundColor: corF, borderColor: corBd, borderRadius: cardRaio }}
      >
        <div className="relative h-20 bg-gray-100">
          {foto ? (
            <Image src={foto} alt={item.nome} fill className="object-cover" sizes="128px" unoptimized loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
          {pct > 0 && (
            <span className="absolute top-1 left-1 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: corP }}>-{pct}%</span>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium leading-tight line-clamp-2"
            style={{ color: corT }}><Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto></p>
          <p className="text-xs text-gray-400 line-through mt-0.5">R$ {fmt(item.preco)}</p>
          <p className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional)}</p>
        </div>
      </div>

      {/* Portal pro <body> — mesmo motivo do SpecialOfferCard/ItemClicavel. */}
      {aberto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setAberto(false)}
        >
          <div
            className="relative flex w-full max-w-lg min-h-[40vh] max-h-[80vh] flex-col rounded-t-2xl border-t shadow-2xl overflow-hidden"
            style={{ backgroundColor: corF, borderColor: corBd }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAberto(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
              aria-label={traduzirInterface('fechar', 'Fechar')}
            >
              ✕
            </button>

            <div className="overflow-y-auto">
              {fotoGrande && (
                <div className="relative h-56 w-full bg-gray-100">
                  <Image src={fotoGrande} alt={item.nome} fill className="object-cover" sizes="512px" unoptimized />
                  {pct > 0 && (
                    <span
                      className="absolute top-3 left-3 text-white text-sm font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: corP }}
                    >
                      -{pct}%
                    </span>
                  )}
                </div>
              )}

              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold" style={{ color: corT }}>
                  <Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto>
                </h3>

                {item.descricao && (
                  <p className="text-sm leading-relaxed opacity-80" style={{ color: corT }}>
                    <Texto tipo="item" id={item.id} campo="descricao">{item.descricao}</Texto>
                  </p>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-sm line-through opacity-50" style={{ color: corT }}>R$ {fmt(item.preco)}</span>
                  <span className="text-2xl font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
