import { createClient } from '@/lib/supabase/client'
import type { Insumo, UnidadeInsumo, Alergeno } from './types'
import { obterFichaTecnica, listarComposicao } from './fichaTecnicaRepository'
import { converterUnidadeMetrica, converterParaUnidadeDoInsumo } from './conversaoUnidade'

export async function listarItensCardapioSimples(estabelecimentoId: string) {
  const supabase = createClient()

  // Mesmo ajuste já feito em CardapioTab.tsx/cardapioParaGarcom.ts: .single()
  // exige exatamente 1 linha (quebra com PGRST116 se houver mais de um menu)
  // e a coluna `ativo` pode nem existir de forma confiável — usa .limit(1) +
  // primeiro item em vez disso.
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: true })
    .limit(1)

  const menu = menus && menus.length > 0 ? menus[0] : null
  if (!menu) return []

  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome, itens_cardapio(id, nome)')
    .eq('menu_id', menu.id)
    .order('ordem', { ascending: true })

  return (categorias || []).flatMap((cat: any) =>
    (cat.itens_cardapio || []).map((item: any) => ({ id: item.id, nome: item.nome, categoria: cat.nome }))
  )
}

export async function listarInsumos(estabelecimentoId: string): Promise<Insumo[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export interface DadosInsumo {
  nome: string
  unidade: UnidadeInsumo
  estoqueAtual: number
  estoqueMinimo: number
  custoUnitario: number
  validadeDiasAlerta: number | null
  alergenoIds: string[]
  /** "1 [unidade] equivale a equivalenciaQtd [equivalenciaUnidade]" — ex:
   *  1 un = 50 g. Opcional; só é usado quando alguma ficha técnica
   *  referencia esse insumo numa unidade diferente da cadastrada aqui. */
  equivalenciaQtd: number | null
  equivalenciaUnidade: UnidadeInsumo | null
}

export async function criarInsumo(estabelecimentoId: string, dados: DadosInsumo) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumos')
    .insert({
      estabelecimento_id: estabelecimentoId,
      nome: dados.nome,
      unidade: dados.unidade,
      estoque_atual: dados.estoqueAtual,
      estoque_minimo: dados.estoqueMinimo,
      custo_unitario: dados.custoUnitario,
      validade_dias_alerta: dados.validadeDiasAlerta,
      equivalencia_qtd: dados.equivalenciaQtd,
      equivalencia_unidade: dados.equivalenciaUnidade,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  if (dados.alergenoIds.length > 0) {
    await salvarAlergenosDoInsumo(data.id, dados.alergenoIds)
  }
}

export async function atualizarInsumo(insumoId: string, dados: DadosInsumo) {
  const supabase = createClient()
  const { error } = await supabase
    .from('insumos')
    .update({
      nome: dados.nome,
      unidade: dados.unidade,
      estoque_minimo: dados.estoqueMinimo,
      custo_unitario: dados.custoUnitario,
      validade_dias_alerta: dados.validadeDiasAlerta,
      equivalencia_qtd: dados.equivalenciaQtd,
      equivalencia_unidade: dados.equivalenciaUnidade,
      updated_at: new Date().toISOString(),
    })
    .eq('id', insumoId)
  if (error) throw new Error(error.message)

  await salvarAlergenosDoInsumo(insumoId, dados.alergenoIds)
}

export async function ajustarEstoque(insumoId: string, novaQuantidade: number) {
  const supabase = createClient()
  const { error } = await supabase
    .from('insumos')
    .update({ estoque_atual: novaQuantidade, updated_at: new Date().toISOString() })
    .eq('id', insumoId)
  if (error) throw new Error(error.message)
}

export async function removerInsumo(insumoId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('insumos').delete().eq('id', insumoId)
  if (error) throw new Error(error.message)
}

export async function listarTodosAlergenos(): Promise<Alergeno[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('allergens').select('*').order('nome', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function listarAlergenosDoInsumo(insumoId: string): Promise<Alergeno[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('insumo_allergens')
    .select('allergen:allergen_id(id, nome, icone)')
    .eq('insumo_id', insumoId)
  if (error) throw new Error(error.message)
  return ((data || []) as unknown as { allergen: Alergeno | null }[])
    .map((linha) => linha.allergen)
    .filter((a): a is Alergeno => a != null)
}

/**
 * Apaga e reinsere os vínculos de alérgeno do insumo — mesmo padrão já
 * usado em outros bridges deste projeto (traduções, alérgeno de item do
 * cardápio): mais simples que diffar item a item, e o volume é pequeno.
 */
async function salvarAlergenosDoInsumo(insumoId: string, alergenoIds: string[]) {
  const supabase = createClient()
  await supabase.from('insumo_allergens').delete().eq('insumo_id', insumoId)
  if (alergenoIds.length > 0) {
    const { error } = await supabase
      .from('insumo_allergens')
      .insert(alergenoIds.map((allergenId) => ({ insumo_id: insumoId, allergen_id: allergenId })))
    if (error) throw new Error(error.message)
  }
}

/**
 * Dá baixa automática no estoque quando um pedido entra em preparo.
 * Recebe uma lista simples (id do item do cardápio + quantidade pedida)
 * de propósito — o módulo de estoque não precisa conhecer o formato de
 * Pedido do módulo de pedidos, só "o que foi consumido".
 *
 * Resolve a ficha técnica do item (se houver) recursivamente até os
 * insumos-folha, descendo por sub-fichas quando existirem, e acumula a
 * quantidade total de cada insumo antes de gravar — evita descontar o
 * mesmo insumo em vários updates separados quando ele aparece em mais de
 * um lugar da composição. Não lança erro se o item não tiver ficha técnica
 * cadastrada (nem todo estabelecimento vai controlar estoque de tudo).
 */
export async function baixarEstoquePorItens(itens: { itemCardapioId: string; quantidade: number }[]) {
  const supabase = createClient()

  for (const item of itens) {
    const { data: ficha } = await supabase
      .from('fichas_tecnicas')
      .select('id')
      .eq('cardapio_item_id', item.itemCardapioId)
      .maybeSingle()

    if (!ficha) continue

    const acumulado = new Map<string, number>()
    await acumularInsumosFolha(ficha.id, item.quantidade, acumulado, new Set())

    for (const [insumoId, qtd] of acumulado) {
      const { data: insumo } = await supabase.from('insumos').select('estoque_atual').eq('id', insumoId).single()
      if (!insumo) continue

      const novaQuantidade = Math.max(0, insumo.estoque_atual - qtd)
      await supabase
        .from('insumos')
        .update({ estoque_atual: novaQuantidade, updated_at: new Date().toISOString() })
        .eq('id', insumoId)
    }
  }
}

/**
 * Desce recursivamente pela composição de uma ficha técnica somando, no
 * mapa `acumulado`, quanto de cada insumo-folha é consumido. `visitados`
 * evita loop infinito por segurança (o trigger anti-ciclo no banco já
 * bloqueia isso na origem, mas não custa nada ter os dois).
 */
async function acumularInsumosFolha(
  fichaTecnicaId: string,
  multiplicador: number,
  acumulado: Map<string, number>,
  visitados: Set<string>
) {
  if (visitados.has(fichaTecnicaId)) return
  visitados.add(fichaTecnicaId)

  const composicao = await listarComposicao(fichaTecnicaId)

  for (const linha of composicao) {
    const qtdLiquida = linha.fator_correcao > 0 ? linha.qtd_bruta / linha.fator_correcao : linha.qtd_bruta
    const qtdTotal = qtdLiquida * multiplicador

    if (linha.tipo === 'insumo' && linha.insumo_id && linha.insumo) {
      // O estoque do insumo é controlado na unidade cadastrada nele, que
      // pode ser diferente da unidade usada nessa linha da composição
      // (ex: composição em gramas, insumo controlado em unidades/latas).
      const qtdNaUnidadeDoInsumo = converterParaUnidadeDoInsumo(qtdTotal, linha.unidade, linha.insumo)
      acumulado.set(linha.insumo_id, (acumulado.get(linha.insumo_id) || 0) + qtdNaUnidadeDoInsumo)
    } else if (linha.tipo === 'sub_ficha' && linha.sub_ficha_id) {
      const subFicha = await obterFichaTecnica(linha.sub_ficha_id)
      const rendimentoUnidade = subFicha?.rendimento_unidade || 'un'
      const rendimento = subFicha?.rendimento_qtd || 1
      // qtdTotal unidades da sub-ficha prontas usadas ÷ rendimento do lote
      // = quantos "lotes" da sub-ficha isso equivale, pra multiplicar a
      // composição dela na mesma proporção. Precisa estar na mesma unidade
      // do rendimento antes de dividir.
      const qtdNaUnidadeDeRendimento = converterUnidadeMetrica(qtdTotal, linha.unidade, rendimentoUnidade)
      await acumularInsumosFolha(linha.sub_ficha_id, qtdNaUnidadeDeRendimento / rendimento, acumulado, visitados)
    }
  }
}
