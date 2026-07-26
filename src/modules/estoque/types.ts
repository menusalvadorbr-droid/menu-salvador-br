export type UnidadeInsumo = 'un' | 'kg' | 'g' | 'l' | 'ml'

export interface Insumo {
  id: string
  estabelecimento_id: string
  nome: string
  unidade: UnidadeInsumo
  estoque_atual: number
  estoque_minimo: number
  created_at: string
  updated_at: string
}

export interface ItemReceita {
  id: string
  item_cardapio_id: string
  insumo_id: string
  quantidade_usada: number
  insumo?: Insumo
}
