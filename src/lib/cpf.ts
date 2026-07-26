// src/lib/cpf.ts
//
// Validação de CPF com checagem de dígito verificador — não basta ter
// 11 dígitos, precisa ser um CPF matematicamente válido (evita erro de
// digitação óbvio e o clássico "111.111.111-11" que muita gente digita
// só pra passar de campos obrigatórios).

export function limparCpf(cpf: string): string {
  return (cpf || '').replace(/\D/g, '')
}

export function formatarCpf(cpf: string): string {
  const limpo = limparCpf(cpf).slice(0, 11)
  return limpo
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function validarCpf(cpf: string): boolean {
  const numeros = limparCpf(cpf)

  if (numeros.length !== 11) return false
  // Rejeita sequências repetidas (111.111.111-11, 000.000.000-00, etc.) —
  // passam na conta do dígito verificador mas nunca são CPFs reais.
  if (/^(\d)\1{10}$/.test(numeros)) return false

  const digitos = numeros.split('').map(Number)

  const calcularDigito = (fatorInicial: number, tamanho: number) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) {
      soma += digitos[i] * (fatorInicial - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const digito1 = calcularDigito(10, 9)
  if (digito1 !== digitos[9]) return false

  const digito2 = calcularDigito(11, 10)
  if (digito2 !== digitos[10]) return false

  return true
}
