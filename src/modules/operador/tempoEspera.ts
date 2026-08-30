/** Tempo decorrido desde um timestamp ISO, formatado curto — usado pelas
 *  linhas da fila única (1a) pra "esperando há Xd/Xh/X min". */
export function haQuantoTempo(iso: string): string {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas}h`
  return `${Math.floor(horas / 24)}d`
}

export function minutosDesde(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}

export type TierEspera = 'baixa' | 'media' | 'alta'

/** Faixa de urgência por tempo de espera — usada pela Central do Operador
 *  pra escalar a cor conforme o item envelhece na fila (2 min não deveria
 *  parecer visualmente igual a 40 min esperando). Limiares arbitrários,
 *  ajustáveis conforme o SLA real do estabelecimento. */
export function tierEspera(minutos: number): TierEspera {
  if (minutos >= 30) return 'alta'
  if (minutos >= 12) return 'media'
  return 'baixa'
}

// Strings sempre literais (nunca concatenadas em runtime) pra o Tailwind
// conseguir escanear e gerar essas classes — mesmo princípio de
// CORES_MODULO em gerenciar/page.tsx.
export const CORES_TIER: Record<TierEspera, { texto: string; ponto: string }> = {
  baixa: { texto: 'text-neutral-500', ponto: 'bg-neutral-300' },
  media: { texto: 'text-amber-700', ponto: 'bg-amber-500' },
  alta: { texto: 'text-red-700', ponto: 'bg-red-500' },
}
