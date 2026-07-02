/**
 * Converte um texto em slug: minúsculas, sem acento, espaços viram hífen.
 * Ex: "Bar do João & Cia" -> "bar-do-joao-cia"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
