'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * Diz se já passou da hidratação (rodando no cliente de verdade), sem cair
 * no anti-padrão de setState dentro de useEffect pra isso — o snapshot do
 * servidor sempre é `false` (bate com o HTML gerado no SSR), o do cliente é
 * `true`; useSyncExternalStore troca de um pro outro sem causar o
 * "cascading render" que o setState síncrono em efeito provoca.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
