/** Formata um valor em reais (número, ex. 1234.5) pro padrão brasileiro
 *  de exibição: "1.234,50" — sempre 2 casas decimais, com separador de
 *  milhar. Uso: `` `R$ ${formatarReais(valor)}` ``.
 *
 *  Não confundir com a função interna (privada) de mesmo nome dentro de
 *  `modules/financeiro/components/InputMoeda.tsx` — aquela trabalha em
 *  CENTAVOS e é só pra máscara de digitação daquele input específico;
 *  esta aqui trabalha em REAIS e é pra qualquer lugar que só precisa
 *  EXIBIR um valor já calculado. São propositalmente duas funções
 *  diferentes — não misture. */
export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
