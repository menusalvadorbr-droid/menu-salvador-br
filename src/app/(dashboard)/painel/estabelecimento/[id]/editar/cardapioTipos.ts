// Tipos compartilhados entre CardapioTab.tsx e os componentes extraídos dele
// (ModalItem, ItemRow, BlocoTraducoes, VariacoesEditor, ComplementosEditor).

export interface Categoria {
  id: string
  nome: string
  menu_id: string
  ordem: number
  foto_url: string | null
}

export interface VariacaoItem {
  id?: string
  nome: string
  preco: string
}

export interface OpcaoComplemento {
  id?: string
  itemId: string
  itemNome?: string // só pra exibição, vem do join ao carregar
  precoAdicional: string
  exibirPreco: boolean // controla se o preço aparece no cardápio público, independente do valor
}

export interface GrupoComplemento {
  id?: string
  nome: string
  selecaoMinima: string
  selecaoMaxima: string
  opcoes: OpcaoComplemento[]
}

export interface ItemCardapio {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria_id: string
  disponivel: boolean
  codigo: string | null
  foto_url: string | null
  promo_status: 'none' | 'pending' | 'active' | 'paused' | null
  preco_promocional: number | null
  promo_desconto_pct: number | null
  promo_inicio: string | null
  promo_fim: string | null
  delivery_disponivel: boolean
  ordem: number
  variacoes?: { id: string; nome: string; preco: number }[]
}

export interface Alergeno {
  id: string
  nome: string
  icone: string
}

// Idiomas fixos suportados — tradução manual, sem lista aberta.
export const IDIOMAS_SUPORTADOS = ['en', 'fr', 'es'] as const
export type Idioma = (typeof IDIOMAS_SUPORTADOS)[number]
export const IDIOMA_LABEL: Record<Idioma, string> = { en: 'Inglês (EN)', fr: 'Francês (FR)', es: 'Espanhol (ES)' }

export type TraducoesCampos = Partial<Record<Idioma, { nome: string; descricao: string }>>
export type TraducoesNome = Partial<Record<Idioma, { nome: string }>>
