// src/lib/cnpj.ts
//
// Validação de CNPJ com checagem de dígito verificador — mesma lógica de
// src/lib/cpf.ts, adaptada para os dois dígitos e pesos do CNPJ.

export function limparCnpj(cnpj: string): string {
  return (cnpj || '').replace(/\D/g, '')
}

export function formatarCnpj(cnpj: string): string {
  const limpo = limparCnpj(cnpj).slice(0, 14)
  return limpo
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function validarCnpj(cnpj: string): boolean {
  const numeros = limparCnpj(cnpj)

  if (numeros.length !== 14) return false
  if (/^(\d)\1{13}$/.test(numeros)) return false // sequência repetida

  const digitos = numeros.split('').map(Number)

  const calcularDigito = (pesos: number[]) => {
    const soma = pesos.reduce((acc, peso, i) => acc + digitos[i] * peso, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const digito1 = calcularDigito(pesos1)
  if (digito1 !== digitos[12]) return false

  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const digito2 = calcularDigito(pesos2)
  if (digito2 !== digitos[13]) return false

  return true
}
