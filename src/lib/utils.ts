/**
 * Remove zeros à esquerda de um número de endereço vindo da Receita
 * (ex: "000585" -> "585"). Preserva o valor como está quando não é um
 * número puro (ex: "S/N", "SN", "KM 5") — só limpa quando faz sentido.
 */
export function limparNumeroEndereco(numero: string | null | undefined): string {
  if (!numero) return ''
  const semZerosEsquerda = numero.replace(/^0+(?=\d)/, '')
  return /^\d+$/.test(numero) ? semZerosEsquerda : numero
}

/**
 * Formata CEP com a máscara padrão 00000-000. Aceita com ou sem
 * pontuação já presente (só usa os dígitos).
 */
export function formatarCep(cep: string): string {
  const digitos = cep.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

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
