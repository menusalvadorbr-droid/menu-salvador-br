import { createClient } from '@/lib/supabase/client'
import { converterUnidadeMetrica, converterParaUnidadeDoInsumo } from './conversaoUnidade'
import type {
  FichaTecnica,
  FichaTecnicaItem,
  FichaTecnicaPasso,
  ComposicaoCalculada,
  ItemComposicaoCalculado,
  AlergenoHerdado,
  Alergeno,
  TipoItemFicha,
  UnidadeInsumo,
  StatusFichaTecnica,
} from './types'

export async function listarFichasTecnicas(estabelecimentoId: string): Promise<FichaTecnica[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fichas_tecnicas')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function obterFichaTecnica(fichaTecnicaId: string): Promise<FichaTecnica | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('fichas_tecnicas').select('*').eq('id', fichaTecnicaId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export interface DadosFichaTecnica {
  cardapioItemId: string | null
  nome: string
  skuPlu: string | null
  categoriaVenda: string | null
  tempoPreparoMin: number | null
  precoVenda: number | null
  cmvAlvoPercentual: number
  rendimentoQtd: number
  rendimentoUnidade: UnidadeInsumo
  status: StatusFichaTecnica
}

export async function criarFichaTecnica(estabelecimentoId: string, dados: DadosFichaTecnica): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('fichas_tecnicas')
    .insert({
      estabelecimento_id: estabelecimentoId,
      cardapio_item_id: dados.cardapioItemId,
      nome: dados.nome,
      sku_plu: dados.skuPlu,
      categoria_venda: dados.categoriaVenda,
      tempo_preparo_min: dados.tempoPreparoMin,
      preco_venda: dados.precoVenda,
      cmv_alvo_percentual: dados.cmvAlvoPercentual,
      rendimento_qtd: dados.rendimentoQtd,
      rendimento_unidade: dados.rendimentoUnidade,
      status: dados.status,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function atualizarFichaTecnica(fichaTecnicaId: string, dados: DadosFichaTecnica) {
  const supabase = createClient()
  const { error } = await supabase
    .from('fichas_tecnicas')
    .update({
      cardapio_item_id: dados.cardapioItemId,
      nome: dados.nome,
      sku_plu: dados.skuPlu,
      categoria_venda: dados.categoriaVenda,
      tempo_preparo_min: dados.tempoPreparoMin,
      preco_venda: dados.precoVenda,
      cmv_alvo_percentual: dados.cmvAlvoPercentual,
      rendimento_qtd: dados.rendimentoQtd,
      rendimento_unidade: dados.rendimentoUnidade,
      status: dados.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fichaTecnicaId)
  if (error) throw new Error(error.message)
}

export async function removerFichaTecnica(fichaTecnicaId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('fichas_tecnicas').delete().eq('id', fichaTecnicaId)
  if (error) throw new Error(error.message)
}

export async function listarComposicao(fichaTecnicaId: string): Promise<FichaTecnicaItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ficha_tecnica_itens')
    .select(
      '*, insumo:insumo_id(id, nome, unidade, custo_unitario, equivalencia_qtd, equivalencia_unidade), sub_ficha:sub_ficha_id(id, nome)'
    )
    .eq('ficha_tecnica_id', fichaTecnicaId)
    .order('ordem', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export interface DadosItemComposicao {
  tipo: TipoItemFicha
  insumoId: string | null
  subFichaId: string | null
  qtdBruta: number
  unidade: UnidadeInsumo
  fatorCorrecao: number
  ordem: number
}

export async function adicionarItemComposicao(fichaTecnicaId: string, dados: DadosItemComposicao) {
  const supabase = createClient()
  const { error } = await supabase.from('ficha_tecnica_itens').insert({
    ficha_tecnica_id: fichaTecnicaId,
    tipo: dados.tipo,
    insumo_id: dados.insumoId,
    sub_ficha_id: dados.subFichaId,
    qtd_bruta: dados.qtdBruta,
    unidade: dados.unidade,
    fator_correcao: dados.fatorCorrecao,
    ordem: dados.ordem,
  })
  // O trigger anti-ciclo do banco rejeita compor uma ficha com ela mesma
  // (direta ou indiretamente) — o erro do Postgres já vem com mensagem
  // legível o suficiente pra mostrar direto na tela.
  if (error) throw new Error(error.message)
}

export async function atualizarItemComposicao(itemId: string, dados: DadosItemComposicao) {
  const supabase = createClient()
  const { error } = await supabase
    .from('ficha_tecnica_itens')
    .update({
      tipo: dados.tipo,
      insumo_id: dados.insumoId,
      sub_ficha_id: dados.subFichaId,
      qtd_bruta: dados.qtdBruta,
      unidade: dados.unidade,
      fator_correcao: dados.fatorCorrecao,
      ordem: dados.ordem,
    })
    .eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function removerItemComposicao(itemId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('ficha_tecnica_itens').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function listarPassos(fichaTecnicaId: string): Promise<FichaTecnicaPasso[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ficha_tecnica_passos')
    .select('*')
    .eq('ficha_tecnica_id', fichaTecnicaId)
    .order('ordem', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

/** Apaga e reinsere todos os passos — mesmo padrão de bridge usado no
 *  resto do módulo, e aqui a ordem inteira muda a cada edição de qualquer
 *  forma, então não vale a pena diffar item a item. */
export async function salvarPassos(fichaTecnicaId: string, passos: { descricao: string }[]) {
  const supabase = createClient()
  await supabase.from('ficha_tecnica_passos').delete().eq('ficha_tecnica_id', fichaTecnicaId)
  if (passos.length > 0) {
    const { error } = await supabase.from('ficha_tecnica_passos').insert(
      passos.map((passo, indice) => ({
        ficha_tecnica_id: fichaTecnicaId,
        ordem: indice,
        descricao: passo.descricao,
      }))
    )
    if (error) throw new Error(error.message)
  }
}

export function calcularQL(qtdBruta: number, fatorCorrecao: number): number {
  return fatorCorrecao > 0 ? qtdBruta / fatorCorrecao : qtdBruta
}

export function calcularCmvPercentual(custoTotal: number, precoVenda: number | null): number | null {
  if (!precoVenda || precoVenda <= 0) return null
  return (custoTotal / precoVenda) * 100
}

/**
 * Custo total e por-item da composição de uma ficha, sempre calculado na
 * hora (nunca armazenado — segue o mesmo princípio já usado em
 * resumoSessao/saldoPendenteDaMesa no financeiro). Desce recursivamente em
 * sub-fichas, diluindo o custo delas pelo próprio rendimento antes de
 * multiplicar pela quantidade líquida usada. `cache` evita recalcular a
 * mesma sub-ficha várias vezes quando ela aparece em mais de um lugar da
 * árvore dentro da mesma chamada.
 */
export async function calcularComposicao(
  fichaTecnicaId: string,
  cache: Map<string, ComposicaoCalculada> = new Map()
): Promise<ComposicaoCalculada> {
  const emCache = cache.get(fichaTecnicaId)
  if (emCache) return emCache

  const composicao = await listarComposicao(fichaTecnicaId)
  const itens: ItemComposicaoCalculado[] = []
  let custoTotal = 0

  for (const linha of composicao) {
    const qtdLiquida = calcularQL(linha.qtd_bruta, linha.fator_correcao)

    if (linha.tipo === 'insumo' && linha.insumo) {
      // A composição pode ser digitada numa unidade diferente da que o
      // insumo tem custo cadastrado (ex: receita em gramas, insumo com
      // custo por unidade/lata) — converte antes de custear.
      const qtdNaUnidadeDoInsumo = converterParaUnidadeDoInsumo(qtdLiquida, linha.unidade, linha.insumo)
      const custoItem = qtdNaUnidadeDoInsumo * linha.insumo.custo_unitario
      itens.push({
        id: linha.id,
        tipo: 'insumo',
        nome: linha.insumo.nome,
        unidade: linha.unidade,
        qtdBruta: linha.qtd_bruta,
        fatorCorrecao: linha.fator_correcao,
        qtdLiquida,
        custoUnitario: linha.insumo.custo_unitario,
        custoItem,
      })
      custoTotal += custoItem
    } else if (linha.tipo === 'sub_ficha' && linha.sub_ficha_id) {
      const [subComposicao, subFicha] = await Promise.all([
        calcularComposicao(linha.sub_ficha_id, cache),
        obterFichaTecnica(linha.sub_ficha_id),
      ])
      const rendimentoUnidade = subFicha?.rendimento_unidade || 'un'
      const rendimento = subFicha?.rendimento_qtd || 1
      // Precisa estar na mesma unidade do rendimento da sub-ficha antes de
      // diluir o custo dela (kg↔g e l↔ml convertem sozinhos; cruzar
      // família exige rendimento e composição na mesma unidade).
      const qtdNaUnidadeDeRendimento = converterUnidadeMetrica(qtdLiquida, linha.unidade, rendimentoUnidade)
      const custoUnitarioSubFicha = subComposicao.custoTotal / rendimento
      const custoItem = qtdNaUnidadeDeRendimento * custoUnitarioSubFicha
      itens.push({
        id: linha.id,
        tipo: 'sub_ficha',
        nome: linha.sub_ficha?.nome || subFicha?.nome || 'Sub-ficha',
        unidade: linha.unidade,
        qtdBruta: linha.qtd_bruta,
        fatorCorrecao: linha.fator_correcao,
        qtdLiquida,
        custoUnitario: custoUnitarioSubFicha,
        custoItem,
      })
      custoTotal += custoItem
    }
  }

  const resultado: ComposicaoCalculada = { itens, custoTotal }
  cache.set(fichaTecnicaId, resultado)
  return resultado
}

/**
 * Alérgenos de toda a composição, direto (insumo usado nesta ficha) ou
 * herdado (via sub-ficha). `origem` é sempre o nome da sub-ficha usada
 * diretamente na ficha de onde a busca partiu — mesmo quando o alérgeno
 * está mais fundo ainda (sub-ficha de sub-ficha), a UI mostra só esse
 * primeiro nível ("Ovo · herdado de Molho especial da casa"), não a cadeia
 * inteira. `visitados` evita reprocessar a mesma sub-ficha duas vezes
 * dentro da mesma árvore (defesa extra além do trigger anti-ciclo no
 * banco).
 */
export async function alergenosHerdados(
  fichaTecnicaId: string,
  origem: string | null = null,
  visitados: Set<string> = new Set()
): Promise<AlergenoHerdado[]> {
  if (visitados.has(fichaTecnicaId)) return []
  visitados.add(fichaTecnicaId)

  const supabase = createClient()
  const composicao = await listarComposicao(fichaTecnicaId)
  const porId = new Map<string, AlergenoHerdado>()

  for (const linha of composicao) {
    if (linha.tipo === 'insumo' && linha.insumo_id) {
      const { data } = await supabase
        .from('insumo_allergens')
        .select('allergen:allergen_id(id, nome, icone)')
        .eq('insumo_id', linha.insumo_id)
      for (const row of (data || []) as unknown as { allergen: Alergeno | null }[]) {
        const alergeno = row.allergen
        if (!alergeno || porId.has(alergeno.id)) continue
        porId.set(alergeno.id, { ...alergeno, direto: origem === null, origem })
      }
    } else if (linha.tipo === 'sub_ficha' && linha.sub_ficha_id) {
      const origemParaFilhos = origem ?? linha.sub_ficha?.nome ?? 'sub-ficha'
      const herdados = await alergenosHerdados(linha.sub_ficha_id, origemParaFilhos, visitados)
      for (const alergeno of herdados) {
        if (!porId.has(alergeno.id)) porId.set(alergeno.id, alergeno)
      }
    }
  }

  return Array.from(porId.values())
}
