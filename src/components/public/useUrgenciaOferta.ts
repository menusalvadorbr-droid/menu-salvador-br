'use client'

import { useState, useEffect } from 'react'

export type NivelUrgencia = 'normal' | 'urgente' | 'critico'

/**
 * Minutos restantes até fimIso e o nível de urgência correspondente —
 * usado tanto pelo contador (ContadorRegressivo) quanto pelo card
 * (SpecialOfferCard, pra decidir borda/sombra/véu), pra ficarem sempre em
 * sincronia sem precisar passar callback de um pro outro.
 */
export function useUrgenciaOferta(fimIso: string, alertaMinutos: number): { mins: number; nivel: NivelUrgencia } {
  const calcMins = () => Math.floor((new Date(fimIso).getTime() - Date.now()) / 60000)
  const [mins, setMins] = useState(calcMins)

  useEffect(() => {
    // Recalcula ao montar (evita hidratação SSR/CSR divergente — o valor
    // inicial do useState já é calculado no primeiro render, mas só é
    // reconfirmado aqui pra garantir que bate com o momento real de
    // montagem no cliente) e depois a cada 30s — granularidade suficiente
    // pra um contador em minutos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMins(calcMins())
    const id = setInterval(() => {
      const m = calcMins()
      setMins(m)
      if (m <= 0) clearInterval(id)
    }, 30_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fimIso])

  const nivel: NivelUrgencia = mins <= 10 ? 'critico' : mins <= alertaMinutos ? 'urgente' : 'normal'
  return { mins, nivel }
}
