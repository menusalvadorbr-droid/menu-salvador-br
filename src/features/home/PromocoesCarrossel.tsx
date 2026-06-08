// src/features/home/PromocoesCarrossel.tsx
'use client'

import { useState, useEffect } from 'react'  // ← sem espaço!
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'

// Estilos do Swiper
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface ItemPromocao {
  id: string
  nome: string
  preco: number
  preco_promocional: number
  foto_url: string | null
  categorias: {
    menus: {
      estabelecimentos: {
        nome: string
        qrcode_short_url: string
      }
    }
  }
}

export default function PromocoesCarrossel() {
  const [itens, setItens] = useState<ItemPromocao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromocoes = async () => {
      try {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .select(`
            id,
            nome,
            preco,
            preco_promocional,
            foto_url,
            categorias!inner (
              menus!inner (
                estabelecimentos!inner (
                  nome,
                  qrcode_short_url
                )
              )
            )
          `)
          .eq('promocao_ativa', true)
          .eq('disponivel', true)
          .limit(20)

        if (error) throw error
        setItens(data || [])
      } catch (error) {
        console.error('Erro ao carregar promoções:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromocoes()
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-pulse text-white">Carregando promoções...</div>
          </div>
        </div>
      </div>
    )
  }

  if (itens.length === 0) return null

  return (
    <section className="bg-gradient-to-r from-orange-500 to-red-500 py-6">
      <div className="container mx-auto px-4">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation
          loop={itens.length > 1}
          speed={800}
          className="promocoes-swiper"
        >
          {itens.map((item) => {
            const estabelecimento = item.categorias?.menus?.estabelecimentos
            const qrcode = estabelecimento?.qrcode_short_url
            const linkHref = qrcode ? `/menu/${qrcode}` : '#'
            const desconto = item.preco && item.preco_promocional
              ? Math.round((1 - item.preco_promocional / item.preco) * 100)
              : 0

            return (
              <SwiperSlide key={item.id}>
                <Link href={linkHref} className="block group">
                  <div className="relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105">
                    {/* Imagem de fundo */}
                    {item.foto_url && (
                      <div className="w-full h-48 bg-gray-800">
                        <img
                          src={item.foto_url}
                          alt={item.nome}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    
                    {/* Overlay escuro para melhor legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Nome do restaurante sobre a imagem (topo) */}
                    <div className="absolute top-2 left-2 right-2">
                      <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full inline-block">
                        {estabelecimento?.nome || 'Restaurante'}
                      </div>
                    </div>
                    
                    {/* Conteúdo do preço e desconto na parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="font-bold text-lg truncate">{item.nome}</h3>
                      <div className="flex items-baseline gap-2 flex-wrap mt-1">
                        <span className="text-white/70 line-through text-sm">
                          R$ {item.preco?.toFixed(2)}
                        </span>
                        <span className="text-2xl font-extrabold">
                          R$ {item.preco_promocional?.toFixed(2)}
                        </span>
                      </div>
                      {desconto > 0 && (
                        <div className="mt-1">
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {desconto}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>

      <style jsx global>{`
        .promocoes-swiper .swiper-pagination-bullet {
          background: white;
          opacity: 0.5;
        }
        .promocoes-swiper .swiper-pagination-bullet-active {
          background: white;
          opacity: 1;
        }
        .promocoes-swiper .swiper-button-prev,
        .promocoes-swiper .swiper-button-next {
          color: white;
          background: rgba(0,0,0,0.3);
          width: 32px;
          height: 32px;
          border-radius: 9999px;
        }
        .promocoes-swiper .swiper-button-prev:hover,
        .promocoes-swiper .swiper-button-next:hover {
          background: rgba(0,0,0,0.6);
        }
        .promocoes-swiper .swiper-button-prev::after,
        .promocoes-swiper .swiper-button-next::after {
          font-size: 14px;
          font-weight: bold;
        }
        @media (max-width: 640px) {
          .promocoes-swiper .swiper-button-prev,
          .promocoes-swiper .swiper-button-next {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}