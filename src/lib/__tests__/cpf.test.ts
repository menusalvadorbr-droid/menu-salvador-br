import { describe, it, expect } from 'vitest'
import { validarCpf, formatarCpf, limparCpf } from '../cpf'

describe('validarCpf', () => {
  it('aceita um CPF matematicamente válido', () => {
    expect(validarCpf('111.444.777-35')).toBe(true)
    expect(validarCpf('11144477735')).toBe(true)
  })

  it('rejeita sequências repetidas mesmo passando no dígito verificador', () => {
    expect(validarCpf('111.111.111-11')).toBe(false)
    expect(validarCpf('000.000.000-00')).toBe(false)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validarCpf('111.444.777-36')).toBe(false)
  })

  it('rejeita tamanho errado', () => {
    expect(validarCpf('123')).toBe(false)
    expect(validarCpf('')).toBe(false)
  })
})

describe('formatarCpf', () => {
  it('aplica a máscara 000.000.000-00', () => {
    expect(formatarCpf('11144477735')).toBe('111.444.777-35')
  })

  it('formata parcialmente enquanto a pessoa ainda está digitando', () => {
    expect(formatarCpf('111444')).toBe('111.444')
  })
})

describe('limparCpf', () => {
  it('remove tudo que não é dígito', () => {
    expect(limparCpf('111.444.777-35')).toBe('11144477735')
  })
})
