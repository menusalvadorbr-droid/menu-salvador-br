// Mesma forma de ItemCardapio em PromocoesTab.tsx — precisa bater exatamente
// (não só um subconjunto), porque renderAcoes recebe esse item e repassa
// pra funções como abrirConfigurar/pausarPromocao/removerPromocao, que
// esperam o objeto ItemCardapio completo.
interface ItemComPromo {
  id: string
  nome: string
  preco: number
  codigo: string | null
  foto_url: string | null
  categoria_id: string
  promo_status: 'none' | 'pending' | 'active' | 'paused' | null
  preco_promocional: number | null
  promo_desconto_pct: number | null
  promo_inicio: string | null
  promo_fim: string | null
}

export default function PromoGrupo({ titulo, hint, cor, itens, readOnly, renderAcoes }: {
  titulo: string; hint?: string; cor: string
  itens: ItemComPromo[]; readOnly: boolean
  renderAcoes: (item: ItemComPromo) => React.ReactNode
}) {
  const borderCor = cor === 'yellow' ? 'border-yellow-200' : cor === 'green' ? 'border-green-200' : 'border-gray-200'
  const headBg    = cor === 'yellow' ? 'bg-yellow-50'      : cor === 'green' ? 'bg-green-50'      : 'bg-gray-50'

  return (
    <div className={`border ${borderCor} rounded-xl overflow-hidden`}>
      <div className={`${headBg} px-4 py-3 border-b ${borderCor}`}>
        <h3 className="font-semibold text-gray-800 text-sm">{titulo} <span className="text-gray-400 font-normal">({itens.length})</span></h3>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {itens.map(item => (
          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${cor === 'gray' ? 'opacity-55' : ''}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
              {item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {item.codigo && <span className="font-mono text-xs text-gray-400">#{item.codigo}</span>}
                <span className="text-sm font-medium text-gray-800 truncate">{item.nome}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {item.promo_desconto_pct
                  ? `-${item.promo_desconto_pct}% · `
                  : item.preco_promocional ? `R$ ${item.preco_promocional.toFixed(2)} · ` : ''}
                {item.promo_fim ? `até ${new Date(item.promo_fim).toLocaleDateString('pt-BR')}` : 'sem data de término'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {item.preco_promocional ? (
                <>
                  <div className="text-xs text-gray-400 line-through">R$ {item.preco?.toFixed(2)}</div>
                  <div className="text-sm font-bold text-orange-600">R$ {item.preco_promocional.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-sm font-bold text-gray-800">R$ {item.preco?.toFixed(2)}</div>
              )}
            </div>
            {!readOnly && <div className="flex-shrink-0">{renderAcoes(item)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
