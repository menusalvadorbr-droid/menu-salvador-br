/**
 * Único ponto de checagem pra funções do cardápio que algum dia podem
 * virar pagas (ver cardapio-v2-visao.md). Hoje sempre libera — quando um
 * sistema de plano de fato existir, a mudança acontece inteira aqui
 * dentro, nenhuma tela do cardápio precisa ser tocada.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function podeUsar(estabelecimento: { id: string }, chaveFuncao: string): boolean {
  return true
}
