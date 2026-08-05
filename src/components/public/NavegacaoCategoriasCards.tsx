import Link from 'next/link'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Texto } from './TraducaoCardapio'

interface CategoriaCard {
  id: string
  nome: string
  foto_url: string | null
}

interface NavegacaoCategoriasCardsProps {
  slug: string
  categorias: CategoriaCard[]
  corS: string
  corBd: string
  cardRaio: string
}

/**
 * Grid de cards retangulares (foto + nome) mostrado antes da lista de
 * itens — alternativa às pílulas/faixas quando "Navegação de categoria" =
 * Cards. Clicar navega pra uma página própria daquela categoria
 * (`/cardapio/[slug]/categoria/[categoriaId]`), que busca só os itens dela
 * — nada aqui carrega item nenhum, só o grid, por isso não é 'use client'
 * (sem interação nenhuma, só links).
 */
export default function NavegacaoCategoriasCards({ slug, categorias, corS, corBd, cardRaio }: NavegacaoCategoriasCardsProps) {
  if (categorias.length === 0) return null

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categorias.map((cat) => {
        const foto = getOptimizedCloudinaryUrl(cat.foto_url, 400, 225, 'fill')
        return (
          <Link
            key={cat.id}
            href={`/cardapio/${slug}/categoria/${cat.id}`}
            className="group relative block aspect-[16/9] overflow-hidden shadow transition hover:shadow-md"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: cardRaio }}
          >
            {foto ? (
              <Image
                src={foto}
                alt={cat.nome}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 45vw, 240px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">🍽️</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute bottom-0 left-0 right-0 p-3 text-sm font-semibold text-white">
              <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
