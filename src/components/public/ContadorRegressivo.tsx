'use client'

import { useUrgenciaOferta } from './useUrgenciaOferta'

interface ContadorRegressivoProps {
  fimIso: string       // ISO string do momento de encerramento
  alertaMinutos: number // a partir de quantos min mostrar alerta
  corP: string         // cor primária do tema
}

export default function ContadorRegressivo({ fimIso, alertaMinutos, corP }: ContadorRegressivoProps) {
  const { mins, nivel } = useUrgenciaOferta(fimIso, alertaMinutos)

  // encerrado
  if (mins <= 0) return (
    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
      Encerrado
    </span>
  )

  // normal — fora da janela de alerta, mostra só o horário de fim
  if (nivel === 'normal') {
    const horario = new Date(fimIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return (
      <span className="text-xs opacity-60 whitespace-nowrap" style={{ color: corP }}>
        ✨ até {horario}h
      </span>
    )
  }

  // últimos minutos: ≤ 10 min — o emoji ganha um leve "salto" (animate-bounce)
  if (nivel === 'critico') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap bg-red-100 text-red-700 animate-pulse">
      <span className="inline-block animate-bounce">🚨</span> {mins}min
    </span>
  )

  // encerrando em breve: entre 10 e alertaMinutos
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap bg-amber-100 text-amber-700">
      ⚡ {mins}min
    </span>
  )
}
