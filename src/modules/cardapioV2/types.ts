export type CanalCardapioV2 = 'presencial' | 'delivery'
export type CanalPadraoCardapioV2 = CanalCardapioV2 | 'ambos'
export type TipoRegraExibicao = 'disponibilidade' | 'promocao' | 'destaque'
export type OrigemTraducao = 'manual' | 'ia'
export type CampoTraduzivel = 'nome' | 'descricao'
export type FormatoExibicaoCardapio = 'lista' | 'catalogo'
export type FotoItemPosicao = 'left' | 'right' | 'top' | 'none'

export interface CardapioV2Cardapio {
  id: string
  estabelecimento_id: string
  nome: string
  canal_padrao: CanalPadraoCardapioV2
  ativo: boolean
  // Recursos opcionais, desligados por padrão — mesmo padrão do V1
  // (cardapio_variacoes_ativado etc. em estabelecimentos): o dono ativa
  // só o que quiser usar, em vez de ver tudo sempre.
  alergenos_ativado: boolean
  info_nutricional_ativado: boolean
  tags_ativado: boolean
  traducao_ativado: boolean
  // Aparência (Fase 6) — edição direta pelo dono, sem catálogo de temas
  // curado como o V1 tem (ver cardapio-v2-visao.md).
  cor_primaria: string
  cor_fundo: string
  cor_texto: string
  fonte: string
  capa_url: string | null
  titulo_exibicao: string | null
  formato_exibicao: FormatoExibicaoCardapio
  foto_item_posicao: FotoItemPosicao
  created_at: string
}

export interface RecursosOpcionaisCardapio {
  alergenos_ativado: boolean
  info_nutricional_ativado: boolean
  tags_ativado: boolean
  traducao_ativado: boolean
}

export interface AparenciaCardapio {
  cor_primaria: string
  cor_fundo: string
  cor_texto: string
  fonte: string
  capa_url: string | null
  titulo_exibicao: string | null
  formato_exibicao: FormatoExibicaoCardapio
  foto_item_posicao: FotoItemPosicao
}

export interface CardapioV2Categoria {
  id: string
  cardapio_id: string
  nome: string
  ordem: number
  ativo: boolean
  created_at: string
}

export interface CardapioV2Item {
  id: string
  categoria_id: string
  nome: string
  descricao: string | null
  foto_url: string | null
  observacao_nutricional: string | null
  preco_base: number
  ordem: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface CardapioV2Variacao {
  id: string
  item_id: string
  nome: string
  preco: number
  ordem: number
}

export interface CardapioV2PrecoPorCanal {
  id: string
  canal: CanalCardapioV2
  preco: number
}

export interface CardapioV2GrupoComplemento {
  id: string
  estabelecimento_id: string
  nome: string
  minimo: number
  maximo: number
  created_at: string
}

export interface CardapioV2GrupoComplementoOpcao {
  id: string
  grupo_id: string
  nome: string
  preco_adicional: number
  ordem: number
}

export interface CardapioV2RegraExibicao {
  id: string
  estabelecimento_id: string
  tipo: TipoRegraExibicao
  item_id: string | null
  categoria_id: string | null
  dias_semana: number[] | null
  horario_de: string | null
  horario_ate: string | null
  disponivel: boolean | null
  promocao_preco: number | null
  promocao_valida_de: string | null
  promocao_valida_ate: string | null
  destaque: boolean | null
  ordem_destaque: number | null
  ativo: boolean
  created_at: string
}

export interface CardapioV2Traducao {
  id: string
  item_id: string | null
  categoria_id: string | null
  idioma: string
  campo: CampoTraduzivel
  texto: string
  origem: OrigemTraducao
  created_at: string
}

// Reflete a tabela real public.allergens (id, nome, icone) — sem slug,
// que só existia (por engano) em src/types/index.ts, nunca de fato na
// tabela (nenhuma query do projeto o seleciona com sucesso).
export interface CardapioV2Alergeno {
  id: string
  nome: string
  icone: string | null
}

// ── Formas compostas usadas pela leitura pública e pelo editor ──────────

export interface CardapioV2ItemCompleto extends CardapioV2Item {
  variacoes: CardapioV2Variacao[]
  precos_canal: CardapioV2PrecoPorCanal[]
  grupos_complemento_ids: string[]
  alergeno_ids: string[]
  tags: string[]
  regras: CardapioV2RegraExibicao[]
}

export interface CardapioV2CategoriaComItens extends CardapioV2Categoria {
  itens: CardapioV2ItemCompleto[]
  regras: CardapioV2RegraExibicao[]
}

// Grupo de complemento já com as opções resolvidas — mesma forma de
// GrupoComplementoComOpcoes (grupoComplementoRepository.ts, usado pelo
// editor autenticado), redeclarado aqui pra leitura pública não depender
// de um arquivo que usa createClient() (cliente autenticado).
export interface CardapioV2GrupoComplementoResolvido extends CardapioV2GrupoComplemento {
  opcoes: CardapioV2GrupoComplementoOpcao[]
}

export interface CardapioV2Publico {
  cardapio: CardapioV2Cardapio
  categorias: CardapioV2CategoriaComItens[]
  alergenos: CardapioV2Alergeno[]
  // Todos os grupos de complemento do estabelecimento (não só os usados
  // nesse cardápio) — cada item referencia os seus por id
  // (grupos_complemento_ids); resolvido aqui pra quem monta o carrinho não
  // precisar de uma consulta extra por item.
  gruposComplemento: CardapioV2GrupoComplementoResolvido[]
}

// ── Payload da RPC transacional (ver migração cardapio_v2_salvar_item) ──

export interface CardapioV2ItemInput {
  id?: string
  categoria_id: string
  nome: string
  descricao?: string | null
  foto_url?: string | null
  observacao_nutricional?: string | null
  preco_base: number
  ordem?: number
  ativo?: boolean
}

export interface CardapioV2VariacaoInput {
  nome: string
  preco: number
  ordem?: number
}
