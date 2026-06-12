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
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'

  return (
    <div className={`p-4 ${editando ? 'bg-blue-50' : 'bg-white'} ${promocao ? 'bg-green-50 border-l-4 border-green-500' : item.disponivel ? '' : 'bg-gray-100 border-l-4 border-gray-300'}`}>
      {/* Layouts */}
      {layout === 'foto-esquerda' && (
        <div className="flex gap-3">
          {/* Foto miniatura */}
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
            {item.foto_url ? (
              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Cabeçalho com código e nome */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.codigo && (
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                  #{item.codigo}
                </span>
              )}
              <span className="font-medium text-gray-800 truncate">{item.nome}</span>
              {promocao && (
                <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>
              )}
              {!item.disponivel && (
                <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>
              )}
            </div>

            {/* Descrição */}
            {item.descricao && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.descricao}</p>
            )}

            {/* Preços e tags */}
            <div className="flex items-center gap-2 mt-2">
              {promocao ? (
                <>
                  <span className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</span>
                  <span className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</span>
                  {item.desconto_percentual && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      -{item.desconto_percentual}%
                    </span>
                  )}
                </>
              ) : (
                <span className="font-bold text-gray-900">R$ {fmt(item.preco)}</span>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 border px-1.5 py-0.5 rounded-full text-gray-500">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {layout === 'foto-topo' && (
        <div>
          {item.foto_url && (
            <div className="w-full h-32 md:h-40 mb-2 rounded-lg overflow-hidden bg-gray-200">
              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
            </div>
          )}
          {/* Cabeçalho */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.codigo && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">#{item.codigo}</span>
            )}
            <span className="font-medium text-gray-800">{item.nome}</span>
            {promocao && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>}
            {!item.disponivel && <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>}
          </div>
          {item.descricao && <p className="text-xs text-gray-500 mt-1">{item.descricao}</p>}
          <div className="flex items-center gap-2 mt-1">
            {promocao ? (
              <>
                <span className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</span>
                <span className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</span>
                {item.desconto_percentual && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">-{item.desconto_percentual}%</span>
                )}
              </>
            ) : (
              <span className="font-bold text-gray-900">R$ {fmt(item.preco)}</span>
            )}
          </div>
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 border px-1.5 py-0.5 rounded-full text-gray-500">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {layout === 'sem-foto' && (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {item.codigo && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">#{item.codigo}</span>
            )}
            <span className="font-medium text-gray-800">{item.nome}</span>
            {promocao && <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">🎉 PROMO</span>}
            {!item.disponivel && <span className="text-xs bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded">Oculto</span>}
          </div>
          {item.descricao && <p className="text-xs text-gray-500 mt-1">{item.descricao}</p>}
          <div className="flex items-center gap-2 mt-1">
            {promocao ? (
              <>
                <span className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</span>
                <span className="font-bold text-green-600">R$ {fmt(item.preco_promocional)}</span>
                {item.desconto_percentual && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">-{item.desconto_percentual}%</span>
                )}
              </>
            ) : (
              <span className="font-bold text-gray-900">R$ {fmt(item.preco)}</span>
            )}
          </div>
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-gray-100 border px-1.5 py-0.5 rounded-full text-gray-500">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botões de ação (mesmos de antes, mas com limite visual) */}
      <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-gray-100">
        <button onClick={onEdit} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar">
          ✏️
        </button>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir">
          🗑️
        </button>
        <button onClick={onTogglePromocao}
          className={`p-1.5 rounded-lg transition ${promocao ? 'text-green-600 hover:bg-green-50' : 'text-purple-500 hover:bg-purple-50'}`}
          title={promocao ? 'Desativar Promoção' : 'Ativar Promoção'}>
          🎉
        </button>
        <button onClick={onTogglePublicar}
          className={`p-1.5 rounded-lg transition ${item.disponivel ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          title={item.disponivel ? 'Ocultar item' : 'Publicar item'}>
          {item.disponivel ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  )
}