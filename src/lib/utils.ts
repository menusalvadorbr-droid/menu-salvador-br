/**
 * Remove zeros à esquerda de um número de endereço vindo da Receita
 * (ex: "000585" -> "585"). Preserva o valor como está quando não é um
 * número puro (ex: "S/N", "SN", "KM 5") — só limpa quando faz sentido.
 * "0"/"00"/"000" é a Receita dizendo "sem número" (não é um endereço de
 * verdade) — vira string vazia em vez de sobreviver como um "0" literal,
 * que atrapalha busca de endereço (ex: link do Google Maps).
 */
export function limparNumeroEndereco(numero: string | null | undefined): string {
  if (!numero) return ''
  const semZerosEsquerda = numero.replace(/^0+(?=\d)/, '')
  if (!/^\d+$/.test(numero)) return numero
  return semZerosEsquerda === '0' ? '' : semZerosEsquerda
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

/** Remove a pontuação do CEP — usar antes de salvar (o input mostra
 *  formatarCep(), mas o banco guarda só os 8 dígitos). */
export function limparCep(cep: string | null | undefined): string {
  return (cep || '').replace(/\D/g, '').slice(0, 8)
}

/**
 * Formata telefone/WhatsApp do estabelecimento com DDD, sem DDI (diferente
 * de formatarTelefoneExibicao em telefone.ts, que é pra telefone de
 * CLIENTE com "+55" — esses campos aqui são number salvo sem DDI). Aceita
 * fixo (8 dígitos) e celular (9 dígitos), formata progressivamente
 * conforme a pessoa digita, igual formatarCep().
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  const digitos = (telefone || '').replace(/\D/g, '').slice(0, 11)
  if (digitos.length <= 2) return digitos
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  if (resto.length <= 4) return `(${ddd}) ${resto}`
  if (resto.length <= 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`
}

/** Remove a pontuação do telefone — usar antes de salvar. */
export function limparTelefone(telefone: string | null | undefined): string {
  return (telefone || '').replace(/\D/g, '').slice(0, 11)
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
