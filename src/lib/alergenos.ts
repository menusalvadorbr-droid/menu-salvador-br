import type { Alergeno } from '@/app/(dashboard)/painel/estabelecimento/[id]/editar/cardapioTipos'

// Usado quando a tabela `allergens` ainda não tem nenhuma linha
// cadastrada (ex: banco recém-criado) — lista oficial da ANVISA
// (RDC 26/2015) como ponto de partida razoável.
export const ALERGENOS_FALLBACK: Alergeno[] = [
  { id: 'gluten', nome: 'Glúten', icone: '🌾' },
  { id: 'crustaceos', nome: 'Crustáceos', icone: '🦐' },
  { id: 'ovo', nome: 'Ovo', icone: '🥚' },
  { id: 'peixe', nome: 'Peixe', icone: '🐟' },
  { id: 'amendoim', nome: 'Amendoim', icone: '🥜' },
  { id: 'nozes', nome: 'Nozes', icone: '🌰' },
  { id: 'soja', nome: 'Soja', icone: '🫘' },
  { id: 'leite', nome: 'Leite', icone: '🥛' },
  { id: 'aipo', nome: 'Aipo', icone: '🥬' },
  { id: 'mostarda', nome: 'Mostarda', icone: '🟡' },
  { id: 'sesamo', nome: 'Sésamo', icone: '⚪' },
  { id: 'sulfitos', nome: 'Sulfitos', icone: '🍷' },
  { id: 'tremoco', nome: 'Tremoço', icone: '🫛' },
  { id: 'moluscos', nome: 'Moluscos', icone: '🐚' },
]
