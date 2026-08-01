export type TipoDesconto = 'valor' | 'percentual'

/**
 * Converte o que foi digitado (valor fixo em R$ ou percentual) no valor
 * monetário do desconto — mesma conta usada tanto na venda balcão quanto
 * no fechamento de conta de mesa, pra não duplicar (e arriscar divergir)
 * essa regra em cada tela que aplica desconto.
 */
export function calcularDesconto(subtotal: number, tipo: TipoDesconto, valorDigitado: number): number {
  if (!(valorDigitado > 0)) return 0
  const desconto = tipo === 'percentual' ? subtotal * (valorDigitado / 100) : valorDigitado
  return Math.min(Math.max(0, desconto), subtotal)
}
