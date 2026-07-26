/**
 * Gera um slug a partir de um texto: minúsculo, sem acento, espaço/símbolo
 * vira hífen. Espelha a função SQL gerar_slug() (ver 035_migrar_bairros_para_slug.sql)
 * — precisam ficar sincronizadas, já que ambas geram o mesmo tipo de valor.
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
