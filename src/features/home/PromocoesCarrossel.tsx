'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Estrutura real: categorias[] -> menus[] -> estabelecimentos[]
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
      }[]
    }[]
  }[]
}

function optimizeCloudinaryUrl(url: string | null, width: number, height: number): string {
  if (!url || !url.includes('cloudinary.com')) return url || ''
  const parts = url.split('/upload/')
  if (parts.length !== 2) return url
  return `${parts[0]}/upload/q_80,f_auto,c_fill,w_${width},h_${height}/${parts[1]}`
}

export function PromocoesCarrossel() {
  const [itens, setItens] = useState<ItemPromocao[]>([])
  const [loading, setLoading] = useState(true)

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
        console.error('Erro ao carregar promoções:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarPromocoes()
  }, [])

  if (loading) return null
  if (itens.length === 0) return null

  return (
    <section className="py-12 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          🎉 Promoções do Momento
        </h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {itens.map((item) => {
            // Acessa o primeiro estabelecimento do primeiro menu da primeira categoria
            const estabelecimento = item.categorias?.[0]?.menus?.[0]?.estabelecimentos?.[0]
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
      </div>
    </section>
  )
}