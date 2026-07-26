/**
 * Calcula idade em anos completos a partir de uma data no formato
 * "YYYY-MM-DD". Usado tanto no formulário (feedback imediato) quanto
 * na checagem do servidor (fonte da verdade).
 */
export function calcularIdade(dataNascimento: string): number | null {
  if (!dataNascimento) return null
  const nascimento = new Date(dataNascimento + 'T00:00:00')
  if (isNaN(nascimento.getTime())) return null

  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const aindaNaoFezAniversarioEsseAno =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())
  if (aindaNaoFezAniversarioEsseAno) idade -= 1

  return idade
}
