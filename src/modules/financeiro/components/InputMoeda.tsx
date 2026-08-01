'use client'

import { useState, type ChangeEvent } from 'react'

const formatarReais = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Campo de valor em reais com máscara automática (digita "1050" → mostra
 * "10,50"), padrão de qualquer PDV/maquininha — evita erro de digitação de
 * vírgula/ponto e o spinner incômodo do input[type=number] nativo em telas
 * de toque. `value`/`onChange` trabalham em reais (número), a máscara é só
 * de exibição.
 */
export default function InputMoeda({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
  autoFocus,
  disabled,
}: {
  value: number
  onChange: (valorEmReais: number) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  disabled?: boolean
}) {
  const [texto, setTexto] = useState(value ? formatarReais(Math.round(value * 100)) : '')
  // Compara contra o valor da prop na última renderização (não um efeito)
  // pra ajustar `texto` quando `value` muda por fora (ex: reset após
  // salvar) sem entrar em loop com o próprio digitar do usuário — padrão
  // "ajustar estado quando uma prop muda" da própria documentação do React,
  // em vez de setState dentro de useEffect.
  const [valorAnterior, setValorAnterior] = useState(value)

  if (value !== valorAnterior) {
    setValorAnterior(value)
    const centavosExternos = Math.round(value * 100)
    const centavosNoTexto = texto ? Math.round(parseFloat(texto.replace(/\./g, '').replace(',', '.')) * 100) : 0
    if (centavosExternos !== centavosNoTexto) {
      setTexto(centavosExternos ? formatarReais(centavosExternos) : '')
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '')
    const centavos = digitos ? parseInt(digitos, 10) : 0
    setTexto(centavos ? formatarReais(centavos) : '')
    onChange(centavos / 100)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        disabled={disabled}
        value={texto}
        onChange={handleChange}
        placeholder={placeholder}
        className={`pl-9 ${className}`}
      />
    </div>
  )
}
