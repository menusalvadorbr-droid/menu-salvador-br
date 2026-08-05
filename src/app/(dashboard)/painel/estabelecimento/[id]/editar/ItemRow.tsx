import { Badge, Acao } from './CardapioUI'
import type { ItemCardapio } from './cardapioTipos'

// ─────────────────────────────────────────────
// LINHA DO ITEM
// ─────────────────────────────────────────────
export default function ItemRow({ item, readOnly, onEditar, onToggleDisponivel, onTogglePromo, onDeletar }: {
  item: ItemCardapio; readOnly: boolean
  onEditar: () => void; onToggleDisponivel: () => void
  onTogglePromo: () => void; onDeletar: () => void
}) {
  const promoAtiva   = item.promo_status === 'active'
  const promoPendente = item.promo_status === 'pending'
  const promoPausada  = item.promo_status === 'paused'
  const temPromo      = promoAtiva || promoPendente || promoPausada

  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group ${!item.disponivel ? 'opacity-50' : ''}`}>
      {/* thumb */}
      <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
        {item.foto_url
          ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
          : <span className="text-xl">🍽️</span>
        }
      </div>

      {/* info */}
      <div className="flex-1 min-w-[140px]">
        <div className="flex items-baseline gap-2 flex-wrap">
          {item.codigo && (
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              #{item.codigo}
            </span>
          )}
          <span className={`text-sm font-medium text-gray-800 truncate ${!item.disponivel ? 'line-through text-gray-400' : ''}`}>
            {item.nome}
          </span>
        </div>
        {item.descricao && (
          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{item.descricao}</p>
        )}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {!item.disponivel   && <Badge cor="gray">Oculto</Badge>}
          {promoAtiva         && <Badge cor="orange">🔥 -{item.promo_desconto_pct}%</Badge>}
          {promoPendente      && <Badge cor="yellow">⏳ Aguarda config.</Badge>}
          {promoPausada       && <Badge cor="gray">⏸ Pausada</Badge>}
          {item.delivery_disponivel && <Badge cor="blue">🛵 Delivery</Badge>}
        </div>
      </div>

      {/* preço */}
      <div className="text-right flex-shrink-0 min-w-[64px]">
        {item.variacoes && item.variacoes.length > 0 ? (
          <>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">A partir de</div>
            <div className="text-sm font-bold text-gray-800">
              R$ {Math.min(...item.variacoes.map((v) => v.preco)).toFixed(2)}
            </div>
            <div className="text-[10px] text-gray-400">{item.variacoes.length} tamanho{item.variacoes.length > 1 ? 's' : ''}</div>
          </>
        ) : promoAtiva && item.preco_promocional ? (
          <>
            <div className="text-xs text-gray-400 line-through">
              R$ {item.preco?.toFixed(2)}
            </div>
            <div className="text-sm font-bold text-orange-600">
              R$ {item.preco_promocional.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-sm font-bold text-gray-800">
            R$ {item.preco?.toFixed(2)}
          </div>
        )}
      </div>

      {/* ações — sempre visíveis (hover não existe em telas de toque);
          flex-wrap no container faz esse bloco quebrar pra linha própria
          quando não cabe mais nada ao lado, em vez de espremer o resto. */}
      {!readOnly && (
        <div className="flex gap-1 flex-shrink-0 ml-auto">
          <Acao onClick={onEditar}          title="Editar"                         emoji="✏️" />
          <Acao onClick={onToggleDisponivel} title={item.disponivel ? 'Ocultar' : 'Exibir'} emoji={item.disponivel ? '👁️' : '🙈'} />
          <Acao onClick={onTogglePromo}     title={temPromo ? 'Remover promoção' : 'Marcar como promoção'} emoji={temPromo ? '🔥' : '🏷️'} destaque={temPromo} />
          <Acao onClick={onDeletar}         title="Remover"                        emoji="🗑️" perigo />
        </div>
      )}
    </div>
  )
}
