export type UnidadeInsumo = 'un' | 'kg' | 'g' | 'l' | 'ml'

export interface Alergeno {
  id: string
  nome: string
  icone: string | null
}

export interface Insumo {
  id: string
  estabelecimento_id: string
  nome: string
  unidade: UnidadeInsumo
  estoque_atual: number
  estoque_minimo: number
  custo_unitario: number
  validade_dias_alerta: number | null
  /** Característica física do produto: "1 [unidade] equivale a
   *  equivalencia_qtd [equivalencia_unidade]" — ex: 1 un = 50 g (ovo),
   *  1 un = 900 ml (lata de óleo). Só é necessária quando alguma ficha
   *  técnica vai usar esse insumo numa unidade diferente da cadastrada
   *  aqui (kg↔g e l↔ml convertem sozinhos, não precisam disso). */
  equivalencia_qtd: number | null
  equivalencia_unidade: UnidadeInsumo | null
  created_at: string
  updated_at: string
}

export type TipoItemFicha = 'insumo' | 'sub_ficha'
export type StatusFichaTecnica = 'ativa' | 'inativa'

export interface FichaTecnica {
  id: string
  estabelecimento_id: string
  cardapio_item_id: string | null
  nome: string
  sku_plu: string | null
  categoria_venda: string | null
  tempo_preparo_min: number | null
  preco_venda: number | null
  cmv_alvo_percentual: number
  rendimento_qtd: number
  rendimento_unidade: UnidadeInsumo
  status: StatusFichaTecnica
  created_at: string
  updated_at: string
}

export interface FichaTecnicaItem {
  id: string
  ficha_tecnica_id: string
  tipo: TipoItemFicha
  insumo_id: string | null
  sub_ficha_id: string | null
  qtd_bruta: number
  unidade: UnidadeInsumo
  fator_correcao: number
  ordem: number
  insumo?: {
    id: string
    nome: string
    unidade: UnidadeInsumo
    custo_unitario: number
    equivalencia_qtd: number | null
    equivalencia_unidade: UnidadeInsumo | null
  } | null
  sub_ficha?: { id: string; nome: string } | null
}

export interface FichaTecnicaPasso {
  id: string
  ficha_tecnica_id: string
  ordem: number
  descricao: string
}

/** Uma linha de composição já com QL e custo calculados — não vem do
 *  banco, é sempre derivado na hora (nunca armazenado). */
export interface ItemComposicaoCalculado {
  id: string
  tipo: TipoItemFicha
  nome: string
  unidade: UnidadeInsumo
  qtdBruta: number
  fatorCorrecao: number
  qtdLiquida: number
  custoUnitario: number
  custoItem: number
}

export interface ComposicaoCalculada {
  itens: ItemComposicaoCalculado[]
  custoTotal: number
}

/** Alérgeno herdado da composição — direto (insumo direto na ficha) ou
 *  herdado de uma sub-ficha usada nela (com o nome dessa sub-ficha como
 *  origem, pra exibir "Ovo · herdado de Molho especial da casa"). */
export interface AlergenoHerdado extends Alergeno {
  direto: boolean
  origem: string | null
}
