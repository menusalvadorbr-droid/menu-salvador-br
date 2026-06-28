export interface ItemCardapio {
  id: string
  nome: string
  descricao: string
  preco: number
  // ... outros campos
  alergenos?: string[] // mantido para compatibilidade
  allergens?: { id: string; nome: string; slug: string; icone: string }[]
}