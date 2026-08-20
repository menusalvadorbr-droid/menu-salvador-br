import { createPublicClient } from '@/lib/supabase/publicServer'

// Dados do cardápio já resolvidos (alérgenos diretos + herdados da Ficha
// Técnica mesclados) — é essa lista, e só ela, que vira o system prompt do
// AI Waiter. Nunca inclui itens de outro estabelecimento.
export interface ItemCardapioContexto {
  nome: string
  descricao: string | null
  preco: number
  precoPromocional: number | null
  disponivel: boolean
  categoria: string
  alergenos: string[]
}

export interface EstabelecimentoContexto {
  id: string
  nome: string
  itens: ItemCardapioContexto[]
}

interface CategoriaBruta {
  id: string
  nome: string
}

interface AllergenEmbed {
  allergen: { nome: string } | null
}

interface ItemCardapioBruto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  disponivel: boolean
  categoria_id: string
  item_allergens: AllergenEmbed[] | null
}

interface FichaTecnicaBruta {
  id: string
  cardapio_item_id: string | null
}

interface ComposicaoBruta {
  ficha_tecnica_id: string
  tipo: 'insumo' | 'sub_ficha'
  insumo_id: string | null
  sub_ficha_id: string | null
}

type ClientePublico = ReturnType<typeof createPublicClient>

/** Busca nome + cardápio completo (disponível ou não) de um estabelecimento
 *  pelo slug público. `null` se o estabelecimento não existe/não está ativo. */
export async function buildCardapioContext(slug: string): Promise<EstabelecimentoContexto | null> {
  const supabase = createPublicClient()

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('id, nome, nome_fantasia')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) return null

  const nome = est.nome_fantasia || est.nome

  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', est.id)
    .order('created_at', { ascending: true })
    .limit(1)
  const menu = menus?.[0]
  if (!menu) return { id: est.id, nome, itens: [] }

  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('menu_id', menu.id)
    .order('ordem')
  const catIds = (categorias || []).map((c: CategoriaBruta) => c.id)
  if (catIds.length === 0) return { id: est.id, nome, itens: [] }
  const nomePorCategoria = new Map((categorias || []).map((c: CategoriaBruta) => [c.id, c.nome]))

  // Propositalmente sem `.eq('disponivel', true)` — o AI Waiter precisa
  // saber dos itens indisponíveis pra poder avisar o cliente sobre eles
  // em vez de simplesmente não conhecê-los.
  const { data: itens } = await supabase
    .from('itens_cardapio')
    .select('id, nome, descricao, preco, preco_promocional, disponivel, categoria_id, item_allergens(allergen:allergen_id(nome))')
    .in('categoria_id', catIds)
    .order('ordem')
  const itensRows = (itens || []) as unknown as ItemCardapioBruto[]

  const herdadosPorItem = await resolverAlergenosHerdados(supabase, est.id, itensRows.map((i) => i.id))

  const itensContexto: ItemCardapioContexto[] = itensRows.map((item) => {
    const diretos = (item.item_allergens || [])
      .map((r) => r.allergen?.nome)
      .filter((n): n is string => Boolean(n))
    const herdados = herdadosPorItem.get(item.id) || []
    return {
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      precoPromocional: item.preco_promocional,
      disponivel: item.disponivel,
      categoria: nomePorCategoria.get(item.categoria_id) || '',
      alergenos: Array.from(new Set([...diretos, ...herdados])),
    }
  })

  return { id: est.id, nome, itens: itensContexto }
}

/** Mesma lógica recursiva de `alergenosHerdados()` em fichaTecnicaRepository.ts
 *  (insumo direto + sub-ficha em qualquer profundidade), só que resolvida em
 *  lote pra todos os itens do estabelecimento de uma vez — poucas queries em
 *  vez de uma cadeia de round-trips por item. */
async function resolverAlergenosHerdados(
  supabase: ClientePublico,
  estabelecimentoId: string,
  itemIds: string[]
): Promise<Map<string, string[]>> {
  const resultado = new Map<string, string[]>()
  if (itemIds.length === 0) return resultado

  const { data: fichas } = await supabase
    .from('fichas_tecnicas')
    .select('id, cardapio_item_id')
    .eq('estabelecimento_id', estabelecimentoId)
    .not('cardapio_item_id', 'is', null)
  const fichasComItem = (fichas || []) as FichaTecnicaBruta[]
  if (fichasComItem.length === 0) return resultado

  const { data: todasFichas } = await supabase
    .from('fichas_tecnicas').select('id').eq('estabelecimento_id', estabelecimentoId)
  const todosFichaIds = (todasFichas || []).map((f: { id: string }) => f.id)
  if (todosFichaIds.length === 0) return resultado

  const { data: composicao } = await supabase
    .from('ficha_tecnica_itens')
    .select('ficha_tecnica_id, tipo, insumo_id, sub_ficha_id')
    .in('ficha_tecnica_id', todosFichaIds)
  const composicaoRows = (composicao || []) as ComposicaoBruta[]

  const composicaoPorFicha = new Map<string, ComposicaoBruta[]>()
  for (const linha of composicaoRows) {
    const lista = composicaoPorFicha.get(linha.ficha_tecnica_id) || []
    lista.push(linha)
    composicaoPorFicha.set(linha.ficha_tecnica_id, lista)
  }

  const insumoIds = Array.from(new Set(
    composicaoRows.filter((l) => l.tipo === 'insumo' && l.insumo_id).map((l) => l.insumo_id as string)
  ))
  const alergenosPorInsumo = new Map<string, string[]>()
  if (insumoIds.length > 0) {
    const { data: insumoAlergenos } = await supabase
      .from('insumo_allergens')
      .select('insumo_id, allergen:allergen_id(nome)')
      .in('insumo_id', insumoIds)
    for (const row of (insumoAlergenos || []) as unknown as { insumo_id: string; allergen: { nome: string } | null }[]) {
      const nomeAlergeno = row.allergen?.nome
      if (!nomeAlergeno) continue
      const lista = alergenosPorInsumo.get(row.insumo_id) || []
      lista.push(nomeAlergeno)
      alergenosPorInsumo.set(row.insumo_id, lista)
    }
  }

  function resolverFicha(fichaId: string, visitados: Set<string>): string[] {
    if (visitados.has(fichaId)) return []
    visitados.add(fichaId)
    const nomes = new Set<string>()
    for (const linha of composicaoPorFicha.get(fichaId) || []) {
      if (linha.tipo === 'insumo' && linha.insumo_id) {
        for (const n of alergenosPorInsumo.get(linha.insumo_id) || []) nomes.add(n)
      } else if (linha.tipo === 'sub_ficha' && linha.sub_ficha_id) {
        for (const n of resolverFicha(linha.sub_ficha_id, visitados)) nomes.add(n)
      }
    }
    return Array.from(nomes)
  }

  for (const ficha of fichasComItem) {
    if (!ficha.cardapio_item_id) continue
    resultado.set(ficha.cardapio_item_id, resolverFicha(ficha.id, new Set()))
  }

  return resultado
}
