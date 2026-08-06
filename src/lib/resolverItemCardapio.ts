import type { GrupoResolvido, OpcaoResolvida, VariacaoResolvida } from '@/modules/pedidos/customer/tiposSelecao'

// Formato cru do Postgrest (join aninhado) → formato já pronto pro
// seletor de item usar (nomes resolvidos, preços numéricos). `resolverOpcao`
// e `resolverGrupo` são mutuamente recursivos porque uma opção pode
// liberar outro grupo (opcao_grupo_complemento), que por sua vez tem
// opções que podem liberar outros grupos.
//
// Compartilhado entre a renderização "eager" da página do cardápio
// (categorias.map de uma vez) e a renderização "lazy" das faixas
// expansíveis (busca uma categoria por vez) — mesmo formato cru chega
// dos dois jeitos, resolvido do mesmo jeito nos dois.
interface ItemGrupoComplementoBruto {
  ordem: number
  grupos_complementos: GrupoComplementoBruto | null
}

interface GrupoComplementoBruto {
  id: string
  nome: string
  selecao_minima: number | null
  selecao_maxima: number | null
  opcoes_complemento: OpcaoComplementoBruto[] | null
}

interface OpcaoComplementoBruto {
  id: string
  ordem: number
  preco_adicional: number | null
  exibir_preco: boolean | null
  itens_cardapio: { nome: string } | null
  opcao_grupo_complemento?: { grupos_complementos: GrupoComplementoBruto | null }[] | null
}

interface VariacaoItemBruta {
  id: string
  nome: string
  preco: number
}

interface AllergenBruto {
  id: string
  nome: string
  icone: string | null
}

export interface ItemCardapioBruto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  codigo: string | null
  foto_url: string | null
  categoria_id: string
  disponivel: boolean
  delivery_disponivel: boolean | null
  promo_status: string | null
  preco_promocional: number | null
  ordem: number
  updated_at: string
  variacoes_item?: VariacaoItemBruta[] | null
  item_grupo_complemento?: ItemGrupoComplementoBruto[] | null
  item_allergens?: { allergen: AllergenBruto | null }[] | null
}

type ComOrdem = { ordem: number }
const porOrdem = (a: ComOrdem, b: ComOrdem) => a.ordem - b.ordem

export function resolverVariacoes(item: ItemCardapioBruto): VariacaoResolvida[] {
  return (item.variacoes_item || []).map((v) => ({ id: v.id, nome: v.nome, preco: v.preco }))
}

function resolverOpcao(o: OpcaoComplementoBruto): OpcaoResolvida {
  return {
    id: o.id,
    nome: o.itens_cardapio?.nome || '(item removido)',
    precoAdicional: o.preco_adicional || 0,
    exibirPreco: o.exibir_preco !== false,
    gruposExtras: (o.opcao_grupo_complemento || [])
      .map((v) => v.grupos_complementos)
      .filter((g): g is GrupoComplementoBruto => Boolean(g))
      .map(resolverGrupo),
  }
}

function resolverGrupo(g: GrupoComplementoBruto): GrupoResolvido {
  return {
    id: g.id,
    nome: g.nome,
    selecaoMinima: g.selecao_minima ?? 0,
    selecaoMaxima: g.selecao_maxima ?? 1,
    opcoes: (g.opcoes_complemento || [])
      .slice()
      .sort(porOrdem)
      .map(resolverOpcao),
  }
}

export function resolverGrupos(item: ItemCardapioBruto): GrupoResolvido[] {
  return (item.item_grupo_complemento || [])
    .slice()
    .sort(porOrdem)
    .map((v) => v.grupos_complementos)
    .filter((g): g is GrupoComplementoBruto => Boolean(g))
    .map(resolverGrupo)
}

export function alergenosDoItem(item: ItemCardapioBruto): AllergenBruto[] {
  return (item.item_allergens || []).map((r) => r.allergen).filter((a): a is AllergenBruto => Boolean(a))
}

/** Formata preço no padrão pt-BR (1.234,56) usado em todo o cardápio público. */
export function fmtPrecoCardapio(v: number) {
  return v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fotoLayout(pos: string) {
  if (pos === 'right') return { flex: 'flex-row-reverse', sz: 'w-24 h-24', sizes: '96px' }
  // aspect-ratio em vez de altura fixa — com h-56 fixo, a foto ficava
  // cada vez mais cortada em telas largas (a largura do card cresce mas
  // a altura não acompanha, esticando o corte do object-cover). 16:9
  // (aspect-video) mantém um corte proporcional em qualquer tela sem
  // deixar o card alto demais — 4/3 tentado antes deixava o card grande
  // demais.
  if (pos === 'top') return { flex: 'flex-col', sz: 'w-full aspect-video', sizes: '400px' }
  if (pos === 'none') return { flex: 'flex-row', sz: '', sizes: '' }
  return { flex: 'flex-row', sz: 'w-24 h-24', sizes: '96px' }
}

/** Seleção completa de uma linha da tabela itens_cardapio já com os joins
 *  usados no cardápio público (alérgenos, variações, grupos de complemento). */
export const SELECT_ITEM_CARDAPIO_PUBLICO =
  '*, item_allergens(allergen:allergen_id(id, nome, icone)), variacoes_item(id, nome, preco), item_grupo_complemento(ordem, grupos_complementos(id, nome, selecao_minima, selecao_maxima, opcoes_complemento(id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome), opcao_grupo_complemento(grupos_complementos(id, nome, selecao_minima, selecao_maxima, opcoes_complemento(id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome)))))))'
