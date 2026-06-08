// src/app/painel/components/ItemCardPreview.tsx
'use client'

interface ItemCardPreviewProps {
  item: any
  layout: 'sem-foto' | 'foto-esquerda' | 'foto-topo'
  onEdit: () => void
  onDelete: () => void
  onTogglePromocao: () => void
  onTogglePublicar: () => void
  editando: boolean
}

function formatarPreco(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return 'R$ 0,00'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ItemCardPreview({
  item,
  layout,
  onEdit,
  onDelete,
  onTogglePromocao,
  onTogglePublicar,
  editando,
}: ItemCardPreviewProps) {
  const promocao = item.promocao_ativa && item.preco_promocional
  const nomeExibicao = item.codigo ? `${item.codigo} - ${item.nome}` : item.nome

  if (editando) return null

  // Layout sem foto
  if (layout === 'sem-foto') {
    return (
      <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
              {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Promoção</span>}
            </div>
            {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="text-right">
            {promocao ? (
              <>
                <div className="text-xs text-gray-400 line-through">{formatarPreco(item.preco)}</div>
                <div className="text-lg font-bold text-green-600">{formatarPreco(item.preco_promocional)}</div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-900">{formatarPreco(item.preco)}</div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
          <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1">✏️ Editar</button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
          <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
          <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>
            {item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}
          </button>
        </div>
      </div>
    )
  }

  // Layout foto à esquerda
  if (layout === 'foto-esquerda') {
    return (
      <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
            {item.foto_url ? (
              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
                {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
              </div>
              <div className="text-right">
                {promocao ? (
                  <>
                    <div className="text-xs text-gray-400 line-through">{formatarPreco(item.preco)}</div>
                    <div className="text-lg font-bold text-green-600">{formatarPreco(item.preco_promocional)}</div>
                  </>
                ) : (
                  <div className="text-lg font-bold text-gray-900">{formatarPreco(item.preco)}</div>
                )}
              </div>
            </div>
            {item.descricao && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.descricao}</p>}
            {item.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
          <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Editar</button>
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
          <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
          <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>
            {item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}
          </button>
        </div>
      </div>
    )
  }

  // Layout foto no topo
  return (
    <div className={`relative p-4 rounded-xl transition ${promocao ? 'bg-red-50 border-2 border-red-200' : 'bg-white border border-gray-200 shadow-sm'}`}>
      {item.foto_url && (
        <div className="w-full h-40 mb-3 rounded-lg overflow-hidden">
          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{nomeExibicao}</h3>
          {promocao && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded mt-1 inline-block">Promoção</span>}
        </div>
        <div className="text-right">
          {promocao ? (
            <>
              <div className="text-xs text-gray-400 line-through">{formatarPreco(item.preco)}</div>
              <div className="text-lg font-bold text-green-600">{formatarPreco(item.preco_promocional)}</div>
            </>
          ) : (
            <div className="text-lg font-bold text-gray-900">{formatarPreco(item.preco)}</div>
          )}
        </div>
      </div>
      {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-gray-100 border px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-200">
        <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 text-sm">✏️ Editar</button>
        <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-sm">🗑️</button>
        <button onClick={onTogglePromocao} className={`text-sm ${promocao ? 'text-green-600' : 'text-purple-500'}`}>🎉</button>
        <button onClick={onTogglePublicar} className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}>
          {item.disponivel ? '👁️ Publicado' : '👁️‍🗨️ Oculto'}
        </button>
      </div>
    </div>
  )
}