import { precoPorCanal } from '@/modules/cardapioV2/publicoRepository'
import type { CanalCardapioV2, CardapioV2ItemCompleto } from '@/modules/cardapioV2/types'

function formatarPreco(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PrecoComVariacao({
  item,
  canal,
  precoPromocional,
}: {
  item: CardapioV2ItemCompleto
  canal: CanalCardapioV2
  precoPromocional: number | null
}) {
  const precoBase = precoPorCanal(item.preco_base, item.precos_canal, canal)

  if (item.variacoes.length > 0) {
    const precosVariacoes = item.variacoes.map((v) => v.preco).sort((a, b) => a - b)
    const menorPreco = precosVariacoes[0]
    return (
      <div className="text-sm font-semibold text-neutral-900">
        a partir de {formatarPreco(menorPreco)}
      </div>
    )
  }

  if (precoPromocional != null && precoPromocional < precoBase) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-neutral-400 line-through">{formatarPreco(precoBase)}</span>
        <span className="text-sm font-semibold text-orange-600">{formatarPreco(precoPromocional)}</span>
      </div>
    )
  }

  return <div className="text-sm font-semibold text-neutral-900">{formatarPreco(precoBase)}</div>
}
