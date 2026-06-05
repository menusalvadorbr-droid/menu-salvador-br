'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function PromocoesCarrossel() {
  const [itens, setItens] = useState<any[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualRef = useRef(false)

  useEffect(() => {
    supabase
      .from('itens_cardapio')
      .select(`
        *,
        categorias!inner (
          menu_id,
          menus!inner (
            estabelecimento_id,
            estabelecimentos!inner (
              nome,
              slug,
              qrcode_short_url
            )
          )
        )
      `)
      .eq('promocao_ativa', true)
      .eq('disponivel', true)
      .limit(20)
      .then(({ data }) => {
        if (data) setItens(data)
      })
  }, [])

  const startAutoPlay = () => {
    stopAutoPlay()
    autoPlayRef.current = setInterval(() => {
      if (!containerRef.current || isManualRef.current) return
      const el = containerRef.current
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: 1, behavior: 'smooth' })
      }
    }, 50)
  }

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }

  const resumeAutoPlay = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      isManualRef.current = false
      startAutoPlay()
    }, 5000)
  }

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return
    isManualRef.current = true
    stopAutoPlay()
    const amount = 300
    containerRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
    resumeAutoPlay()
  }

  useEffect(() => {
    if (itens.length === 0) return
    startAutoPlay()
    return () => stopAutoPlay()
  }, [itens])

  const handleMouseEnter = () => {
    isManualRef.current = true
    stopAutoPlay()
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
  }

  const handleMouseLeave = () => {
    resumeAutoPlay()
  }

  if (itens.length === 0) return null

  const cards = itens.map((item) => {
    const estabelecimento = item.categorias?.menus?.estabelecimentos
    const qrcode = estabelecimento?.qrcode_short_url
    const card = (
      <div className="bg-white/10 backdrop-blur rounded-xl p-4 w-[250px] flex-shrink-0 mx-2">
        <div className="text-sm opacity-75 mb-1">
          {estabelecimento?.nome || 'Restaurante'}
        </div>
        <h3 className="font-bold text-lg mb-1">{item.nome}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg line-through opacity-75">
            R$ {item.preco?.toFixed(2)}
          </span>
          <span className="text-2xl font-bold">
            R$ {item.preco_promocional?.toFixed(2)}
          </span>
        </div>
      </div>
    )
    return qrcode ? (
      <Link key={item.id} href={`/menu/${qrcode}`} className="hover:scale-105 transition-transform">
        {card}
      </Link>
    ) : (
      <div key={item.id}>{card}</div>
    )
  })

  return (
    <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-8 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4 text-center">🎉 Promoções</h2>
        <div className="relative">
          <button
            onClick={() => handleManualScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition"
          >
            ◀
          </button>
          <button
            onClick={() => handleManualScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition"
          >
            ▶
          </button>
          <div
            ref={containerRef}
            className="flex gap-4 overflow-x-auto pb-4 mx-10"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {cards}
            {/* Duplicar cards para efeito infinito */}
            {cards}
          </div>
        </div>
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}