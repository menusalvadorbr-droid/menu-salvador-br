import Image from 'next/image'

interface ItemPublicoProps {
  item: {
    id: string
    nome: string
    descricao?: string | null
    preco: number
    foto_url?: string | null
  }
}

/**
 * Cartão público de item de cardápio — usado nas seções de promoções,
 * destaques e listagens por bairro/cidade. Sem nenhuma ação de edição,
 * só exibição (esse componente nunca aparece dentro do painel administrativo).
 */
export default function ItemPublico({ item }: ItemPublicoProps) {
  const precoFormatado = item.preco?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="flex gap-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-3">
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {item.foto_url ? (
          <Image
            src={item.foto_url}
            alt={item.nome}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
            🍽️
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate">{item.nome}</h3>
        {item.descricao && (
          <p className="text-sm text-gray-500 line-clamp-2">{item.descricao}</p>
        )}
        <p className="text-orange-600 font-bold mt-1">{precoFormatado}</p>
      </div>
    </div>
  )
}
