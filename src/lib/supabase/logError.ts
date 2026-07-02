/**
 * logSupabaseError
 *
 * O Next.js 16 + Turbopack intercepta console.error() e serializa os
 * argumentos para exibir no overlay de dev. PostgrestError estende Error
 * — cujo `message` é não-enumerável — então JSON.stringify() resulta em
 * `{}` e o console não mostra nada útil.
 *
 * Esta função extrai as propriedades relevantes antes de logar, garantindo
 * que o erro seja legível tanto no terminal quanto no browser.
 */
export function logSupabaseError(label: string, error: unknown): void {
  if (!error) {
    console.error(label, '(erro vazio ou nulo)')
    return
  }

  // PostgrestError: message (herdado de Error, não-enumerável) + code, details, hint
  if (typeof error === 'object') {
    const e = error as Record<string, unknown>
    console.error(label, {
      message: e['message'] ?? String(error),
      code:    e['code'],
      details: e['details'],
      hint:    e['hint'],
      name:    e['name'],
    })
    return
  }

  console.error(label, String(error))
}
