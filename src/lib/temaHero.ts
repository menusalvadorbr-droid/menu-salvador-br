/**
 * Overlay do hero quando o fundo é uma foto — em vez de escurecer com
 * preto uniforme, a foto se esmaece em degradê até a cor de fundo do
 * tema (cor_fundo), pra se misturar com o resto da página em vez de
 * sumir atrás de uma camada preta genérica. O "véu" (20–100%, mínimo
 * travado pra sempre sobrar alguma proteção de legibilidade) controla
 * até onde esse degradê cobre a foto: quanto maior, mais cedo (de cima
 * pra baixo) a transição pra cor_fundo começa.
 */
export function gradienteHeroImagem(corFundo: string, veuOpacidade: number): string {
  const intensidade = Math.min(100, Math.max(20, veuOpacidade))
  return `linear-gradient(to bottom, transparent ${100 - intensidade}%, ${corFundo} 100%)`
}
