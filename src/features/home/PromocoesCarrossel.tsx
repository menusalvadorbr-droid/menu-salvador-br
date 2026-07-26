'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { PromocaoCarrossel } from './getPromocoesAtivas'

function otimizarCloudinary(url: string | null, width: number, height: number): string | null {
  // Só aceita imagens do Cloudinary — qualquer outro domínio (ex: dado de
  // teste apontando pra Unsplash) é ignorado, porque o next/image exige
  // que todo domínio externo esteja liberado no next.config.ts, e o
  // modelo de dados do projeto é Cloudinary-only.
  if (!url || !url.includes('res.cloudinary.com')) return null
  const partes = url.split('/upload/')
  if (partes.length !== 2) return null
  return `${partes[0]}/upload/q_80,f_auto,c_fill,w_${width},h_${height}/${partes[1]}`
}

/**
 * Recebe os itens já prontos do servidor (ver getPromocoesAtivas) — só
 * cuida da parte interativa: scroll horizontal, autoplay, setas e touch.
 */
export function PromocoesCarrossel({ itens }: { itens: PromocaoCarrossel[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [podeVoltar, setPodeVoltar] = useState(false)
  const [podeAvancar, setPodeAvancar] = useState(true)

  function atualizarSetas() {
    const container = containerRef.current
    if (!container) return
    setPodeVoltar(container.scrollLeft > 10)
    setPodeAvancar(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  function rolar(direcao: 1 | -1) {
    containerRef.current?.scrollBy({ left: direcao * 300, behavior: 'smooth' })
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || itens.length < 2) return

    const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefereReduzirMovimento) return

    let intervalo: NodeJS.Timeout
    const iniciarAutoplay = () => {
      intervalo = setInterval(() => {
        const maxScroll = container.scrollWidth - container.clientWidth
        if (container.scrollLeft >= maxScroll - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          container.scrollBy({ left: 280, behavior: 'smooth' })
        }
      }, 4000)
    }

    iniciarAutoplay()
    const pausar = () => clearInterval(intervalo)
    const retomar = () => iniciarAutoplay()

    container.addEventListener('mouseenter', pausar)
    container.addEventListener('mouseleave', retomar)
    container.addEventListener('touchstart', pausar)
    container.addEventListener('touchend', retomar)
    container.addEventListener('scroll', atualizarSetas)
    atualizarSetas()

    return () => {
      clearInterval(intervalo)
      container.removeEventListener('mouseenter', pausar)
      container.removeEventListener('mouseleave', retomar)
      container.removeEventListener('touchstart', pausar)
      container.removeEventListener('touchend', retomar)
      container.removeEventListener('scroll', atualizarSetas)
    }
  }, [itens])

  if (itens.length === 0) return null

  return (
    <section className="bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">🎉 Promoções do momento</h2>
          {itens.length > 2 && (
            <div className="hidden gap-2 sm:flex">
              <button
                onClick={() => rolar(-1)}
                disabled={!podeVoltar}
                suppressHydrationWarning
                aria-label="Ver promoções anteriores"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-[var(--brand-primary)]/50 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => rolar(1)}
                disabled={!podeAvancar}
                suppressHydrationWarning
                aria-label="Ver mais promoções"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-[var(--brand-primary)]/50 disabled:opacity-30"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {itens.map((item) => (
            <Link
              key={item.id}
              href={`/cardapio/${item.slug}`}
              className="max-w-[280px] min-w-[250px] flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
            >
              <div className="relative h-40 bg-neutral-100">
                {(() => {
                  const urlImagem = otimizarCloudinary(item.foto_url, 400, 200)
                  return urlImagem ? (
                    <Image
                      src={urlImagem}
                      alt={item.nome}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                  )
                })()}
                <span
                  className="absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  Promoção
                </span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-semibold text-neutral-800">{item.nome}</h3>
                <p className="mt-1 text-sm text-neutral-500">{item.nomeEstabelecimento}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold" style={{ color: 'var(--brand-secondary)' }}>
                    R$ {item.preco_promocional?.toFixed(2)}
                  </span>
                  <span className="text-sm text-neutral-400 line-through">
                    R$ {item.preco?.toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
