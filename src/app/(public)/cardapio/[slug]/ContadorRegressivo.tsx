'use client'

import { useState, useEffect } from 'react'

interface ContadorRegressivoProps {
  fimIso: string       // ISO string do momento de encerramento
  alertaMinutos: number // a partir de quantos min mostrar alerta
  corP: string         // cor primária do tema
}

export default function ContadorRegressivo({ fimIso, alertaMinutos, corP }: ContadorRegressivoProps) {
  const calcMins = () => Math.floor((new Date(fimIso).getTime() - Date.now()) / 60000)

  const [mins, setMins] = useState(calcMins)

  useEffect(() => {
    // atualiza imediatamente ao montar (evita hidratação SSR/CSR divergente)
    setMins(calcMins())

    const id = setInterval(() => {
      const m = calcMins()
      setMins(m)
      if (m <= 0) clearInterval(id)
    }, 30_000) // a cada 30s é suficiente para minutos

    return () => clearInterval(id)
  }, [fimIso])

  // encerrado
  if (mins <= 0) return (
    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
      Encerrado
    </span>
  )

  // fora da janela de alerta — mostra só o horário de fim
  if (mins > alertaMinutos) {
    const horario = new Date(fimIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return (
      <span className="text-xs opacity-60 whitespace-nowrap" style={{ color: corP }}>
        até {horario}h
      </span>
    )
  }

  // crítico: ≤ 10 min
  if (mins <= 10) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap bg-red-100 text-red-700 animate-pulse">
      🚨 {mins}min
    </span>
  )

  // urgente: entre 10 e alertaMinutos
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap bg-amber-100 text-amber-700">
      ⏰ {mins}min
    </span>
  )
}
