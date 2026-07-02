'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import Link from 'next/link'

function optimizeCloudinaryUrl(url: string | null, width: number, height: number): string {
  if (!url || !url.includes('cloudinary.com')) return url || ''
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  return `${parts[0]}/upload/q_80,f_auto,c_fill,w_${width},h_${height}/${parts[1]}`
}

export function PromocoesCarrossel() {
  const supabase = createClient()
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Carregar dados
  useEffect(() => {
    const carregarPromocoes = async () => {
      try {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .select(`
            id,
            nome,
            preco,
            preco_promocional,
            foto_url,
            categorias (
              menus (
                estabelecimentos (
                  nome,
                  qrcode_short_url
                )
              )
            )
          `)
          .eq('promocao_ativa', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        setItens(data || [])
      } catch (error) {
        logSupabaseError('Erro ao carregar promoções:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarPromocoes()
  }, [])

  // Autoplay: move o scroll automaticamente a cada 3 segundos
  useEffect(() => {
    if (!containerRef.current || itens.length < 2) return

    const container = containerRef.current
    let scrollInterval: NodeJS.Timeout

    const startAutoplay = () => {
      scrollInterval = setInterval(() => {
        if (!container) return
        const maxScrollLeft = container.scrollWidth - container.clientWidth

        // Se chegou ao final, volta ao início suavemente
        if (container.scrollLeft >= maxScrollLeft - 10) {
          container.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          // Avança 300px + largura de um card
          container.scrollBy({ left: 280, behavior: 'smooth' })
        }
      }, 3000)
    }

    startAutoplay()

    // Pausa autoplay quando o usuário interage (mouse/touch)
    const pauseAutoplay = () => clearInterval(scrollInterval)
    const resumeAutoplay = () => startAutoplay()

    container.addEventListener('mouseenter', pauseAutoplay)
    container.addEventListener('mouseleave', resumeAutoplay)
    container.addEventListener('touchstart', pauseAutoplay)
    container.addEventListener('touchend', resumeAutoplay)

    return () => {
      clearInterval(scrollInterval)
      container.removeEventListener('mouseenter', pauseAutoplay)
      container.removeEventListener('mouseleave', resumeAutoplay)
      container.removeEventListener('touchstart', pauseAutoplay)
      container.removeEventListener('touchend', resumeAutoplay)
    }
  }, [itens])

  if (loading) return null
  if (itens.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          🎉 Promoções do Momento
        </h2>

        {/* Container com scroll horizontal e barra escondida */}
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {itens.map((item: any) => {
            // Acesso flexível (array ou objeto)
            const categorias = Array.isArray(item.categorias) ? item.categorias : [item.categorias]
            const menus = Array.isArray(categorias[0]?.menus) ? categorias[0]?.menus : [categorias[0]?.menus]
            const estabelecimentos = Array.isArray(menus[0]?.estabelecimentos) ? menus[0]?.estabelecimentos : [menus[0]?.estabelecimentos]
            const estabelecimento = estabelecimentos[0]

            const shortUrl = estabelecimento?.qrcode_short_url || '#'
            const nomeEstabelecimento = estabelecimento?.nome || 'Estabelecimento'

            return (
              <Link
                key={item.id}
                href={`/menu/${shortUrl}`}
                className="min-w-[250px] max-w-[280px] bg-white rounded-xl shadow-md hover:shadow-lg transition flex-shrink-0 overflow-hidden"
              >
                <div className="h-40 bg-gray-100 relative">
                  {item.foto_url ? (
                    <img
                      src={optimizeCloudinaryUrl(item.foto_url, 400, 200)}
                      alt={item.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    Promoção
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 line-clamp-2">{item.nome}</h3>
                  <p className="text-sm text-gray-500 mt-1">{nomeEstabelecimento}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-red-600">
                      R$ {item.preco_promocional?.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      R$ {item.preco?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Adicione este estilo para esconder a scrollbar no Chrome/Safari */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}