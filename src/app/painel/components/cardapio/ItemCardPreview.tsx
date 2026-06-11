'use client'

import { ImageUpload } from '@/components/upload/ImageUpload'

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
  return (
    <div className={`p-4 ${editando ? 'bg-blue-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">{item.nome}</h4>
          <p className="text-sm text-gray-500">{item.descricao}</p>
          <p className="text-lg font-bold mt-1">
            {item.promocao_ativa && item.preco_promocional ? (
              <>
                <span className="line-through text-gray-400 mr-2">R$ {item.preco?.toFixed(2)}</span>
                <span className="text-red-600">R$ {item.preco_promocional?.toFixed(2)}</span>
              </>
            ) : (
              <span>R$ {item.preco?.toFixed(2)}</span>
            )}
          </p>
          {/* Imagem miniatura (opcional) */}
          {item.foto_url && (
            <img src={item.foto_url} alt={item.nome} className="w-16 h-16 object-cover rounded mt-2" />
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button onClick={onEdit} className="text-blue-600 text-sm">✏️</button>
          <button onClick={onTogglePromocao} className="text-sm">
            {item.promocao_ativa ? '🔥' : '📛'}
          </button>
          <button
            onClick={onTogglePublicar}
            className={`text-sm ${item.disponivel ? 'text-green-600' : 'text-gray-400'}`}
          >
            {item.disponivel ? '👁️' : '👁️‍🗨️'}
          </button>
          <button onClick={onDelete} className="text-red-600 text-sm">🗑️</button>
        </div>
      </div>
    </div>
  )
}