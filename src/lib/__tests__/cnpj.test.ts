import { describe, it, expect } from 'vitest'
import { validarCnpj, formatarCnpj, limparCnpj } from '../cnpj'

describe('validarCnpj', () => {
  it('aceita um CNPJ matematicamente válido', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true)
    expect(validarCnpj('11222333000181')).toBe(true)
  })

  it('rejeita sequências repetidas mesmo passando no dígito verificador', () => {
    expect(validarCnpj('11.111.111/1111-11')).toBe(false)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false)
  })

  it('rejeita tamanho errado', () => {
    expect(validarCnpj('123')).toBe(false)
    expect(validarCnpj('')).toBe(false)
  })
})

describe('formatarCnpj', () => {
  it('aplica a máscara 00.000.000/0000-00', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})

describe('limparCnpj', () => {
  it('remove tudo que não é dígito', () => {
    expect(limparCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })
})
