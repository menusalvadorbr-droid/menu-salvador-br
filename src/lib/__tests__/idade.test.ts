import { describe, it, expect, vi, afterEach } from 'vitest'
import { calcularIdade } from '../idade'

// Data fixada, pra o teste não depender do dia em que é rodado.
const HOJE_FIXO = new Date('2026-07-26T12:00:00')

describe('calcularIdade', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calcula certo quando já fez aniversário esse ano', () => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE_FIXO)
    expect(calcularIdade('2000-01-15')).toBe(26)
  })

  it('calcula certo quando ainda não fez aniversário esse ano', () => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE_FIXO)
    expect(calcularIdade('2000-12-25')).toBe(25)
  })

  it('calcula certo no dia exato do aniversário', () => {
    vi.useFakeTimers()
    vi.setSystemTime(HOJE_FIXO)
    expect(calcularIdade('2008-07-26')).toBe(18)
  })

  it('retorna null pra data vazia ou inválida', () => {
    expect(calcularIdade('')).toBeNull()
    expect(calcularIdade('data-invalida')).toBeNull()
  })
})
