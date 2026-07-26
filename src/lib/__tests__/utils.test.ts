import { describe, it, expect } from 'vitest'
import { limparNumeroEndereco, formatarCep, slugify } from '../utils'

describe('limparNumeroEndereco', () => {
  it('remove zeros à esquerda de número puro', () => {
    expect(limparNumeroEndereco('000585')).toBe('585')
    expect(limparNumeroEndereco('007')).toBe('7')
  })

  it('preserva "S/N" e variações sem tentar limpar', () => {
    expect(limparNumeroEndereco('S/N')).toBe('S/N')
    expect(limparNumeroEndereco('SN')).toBe('SN')
    expect(limparNumeroEndereco('KM 5')).toBe('KM 5')
  })

  it('lida com vazio/nulo', () => {
    expect(limparNumeroEndereco('')).toBe('')
    expect(limparNumeroEndereco(null)).toBe('')
    expect(limparNumeroEndereco(undefined)).toBe('')
  })

  it('não mexe em número sem zero à esquerda', () => {
    expect(limparNumeroEndereco('585')).toBe('585')
  })
})

describe('formatarCep', () => {
  it('aplica a máscara 00000-000', () => {
    expect(formatarCep('41940340')).toBe('41940-340')
  })

  it('não quebra com entrada parcial (enquanto digita)', () => {
    expect(formatarCep('419')).toBe('419')
    expect(formatarCep('41940')).toBe('41940')
  })

  it('ignora caracteres não numéricos já presentes', () => {
    expect(formatarCep('41940-340')).toBe('41940-340')
  })
})

describe('slugify', () => {
  it('remove acento e pontuação, troca espaço por hífen', () => {
    expect(slugify('Bar do João & Cia')).toBe('bar-do-joao-cia')
  })

  it('colapsa hífens repetidos', () => {
    expect(slugify('Café   Central')).toBe('cafe-central')
  })
})
