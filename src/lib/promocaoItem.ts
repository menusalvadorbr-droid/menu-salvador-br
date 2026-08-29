export type TipoDescontoPromo = 'pct' | 'fixed'

/**
 * Preço promocional a partir do preço base + tipo/valor de desconto —
 * mesma conta usada tanto ao editar um item (CardapioTab.tsx) quanto ao
 * ativar uma promoção (PromocoesTab.tsx), pra não duplicar (e arriscar
 * divergir) essa regra. Retorna null quando o resultado zera ou fica
 * negativo — quem chama trata como "preço promocional inválido".
 */
export function calcularPrecoPromocional(precoBase: number, tipo: TipoDescontoPromo, valorDesconto: number): number | null {
  const precoPromo = tipo === 'pct'
    ? parseFloat((precoBase * (1 - valorDesconto / 100)).toFixed(2))
    : parseFloat((precoBase - valorDesconto).toFixed(2))
  return precoPromo > 0 ? precoPromo : null
}
