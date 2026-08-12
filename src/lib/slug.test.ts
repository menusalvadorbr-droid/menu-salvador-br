import { describe, it, expect } from 'vitest'
import { gerarSlug } from './slug'

describe('gerarSlug', () => {
  const casos: [string, string][] = [
    ['Vitória da Conquista', 'vitoria-da-conquista'],
    ['Itapuã', 'itapua'],
    ["McDonald's", 'mcdonalds'],
    ['Bar & Cia', 'bar-e-cia'],
    ['Café  do  Zé', 'cafe-do-ze'],
    ['--Teste--', 'teste'],
    ['Pão de Açúcar', 'pao-de-acucar'],
  ]

  for (const [entrada, esperado] of casos) {
    it(`"${entrada}" -> "${esperado}"`, () => {
      expect(gerarSlug(entrada)).toBe(esperado)
    })
  }
})
