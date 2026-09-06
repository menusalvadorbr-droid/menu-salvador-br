import { createPublicClient } from '@/lib/supabase/publicServer'
import { logSupabaseError } from '@/lib/supabase/logError'
import type {
  CardapioV2Alergeno,
  CardapioV2CategoriaComItens,
  CardapioV2Publico,
  CardapioV2RegraExibicao,
  CanalCardapioV2,
} from './types'
import { SELECT_ITEM_CARDAPIO_V2_COMPLETO, agruparRegrasPorDono, itemBrutoParaCompleto, type ItemBrutoComRelacoes } from './shapeCardapio'

/**
 * Busca o cardápio público completo de um estabelecimento pro canal
 * informado (presencial|delivery) — usado pela página server-rendered de
 * exibição. Sem cliente autenticado: RLS libera select geral nas tabelas
 * cardapio_v2_* (ver migração 20260906_cardapio_v2_schema.sql), então
 * createPublicClient (só anon key, sem cookies) já é suficiente e permite
 * a rota continuar estática/ISR.
 */
export async function buscarCardapioPublico(
  estabelecimentoId: string,
  canal: CanalCardapioV2
): Promise<CardapioV2Publico | null> {
  const supabase = createPublicClient()

  // Página pública: um erro numa consulta não pode derrubar a página
  // inteira (o visitante não pode ver stack trace) — cada erro é logado
  // (logSupabaseError, não console.error puro: PostgrestError.message não
  // é enumerável e sumiria num JSON.stringify simples) e a função segue
  // com dado vazio, mesmo princípio do V1 (ver cardapio/[slug]/page.tsx).
  const { data: cardapios, error: erroCardapios } = await supabase
    .from('cardapio_v2_cardapios')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('ativo', true)
    .in('canal_padrao', [canal, 'ambos'])
    .order('created_at', { ascending: true })
    .limit(1)
  if (erroCardapios) logSupabaseError('Erro ao buscar cardápio V2:', erroCardapios)

  const cardapio = cardapios?.[0]
  if (!cardapio) return null

  const { data: categoriasBrutas, error: erroCategorias } = await supabase
    .from('cardapio_v2_categorias')
    .select('*')
    .eq('cardapio_id', cardapio.id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })
  if (erroCategorias) logSupabaseError('Erro ao buscar categorias do cardápio V2:', erroCategorias)

  const categorias = categoriasBrutas ?? []
  const categoriaIds = categorias.map((c) => c.id)

  const [{ data: itensBrutos, error: erroItens }, { data: regrasBrutas, error: erroRegras }] = await Promise.all([
    categoriaIds.length === 0
      ? Promise.resolve({ data: [] as ItemBrutoComRelacoes[], error: null })
      : supabase
          .from('cardapio_v2_itens')
          .select(SELECT_ITEM_CARDAPIO_V2_COMPLETO)
          .in('categoria_id', categoriaIds)
          .eq('ativo', true)
          .order('ordem', { ascending: true }),
    supabase
      .from('cardapio_v2_regras_exibicao')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('ativo', true),
  ])
  if (erroItens) logSupabaseError('Erro ao buscar itens do cardápio V2:', erroItens)
  if (erroRegras) logSupabaseError('Erro ao buscar regras de exibição do cardápio V2:', erroRegras)

  const itens = (itensBrutos ?? []) as unknown as ItemBrutoComRelacoes[]
  const regras = (regrasBrutas ?? []) as CardapioV2RegraExibicao[]

  const allergenIds = Array.from(new Set(itens.flatMap((i) => i.cardapio_v2_item_allergens.map((a) => a.allergen_id))))
  const { data: allergensBrutos, error: erroAlergenos } = allergenIds.length
    ? await supabase.from('allergens').select('id, nome, icone').in('id', allergenIds)
    : { data: [] as CardapioV2Alergeno[], error: null }
  if (erroAlergenos) logSupabaseError('Erro ao buscar alérgenos do cardápio V2:', erroAlergenos)
  const alergenos = (allergensBrutos ?? []) as CardapioV2Alergeno[]

  const { porItem: regrasPorItem, porCategoria: regrasPorCategoria } = agruparRegrasPorDono(regras)

  const itensPorCategoria = new Map<string, ReturnType<typeof itemBrutoParaCompleto>[]>()
  for (const item of itens) {
    const itemCompleto = itemBrutoParaCompleto(item, regrasPorItem.get(item.id) ?? [])
    itensPorCategoria.set(item.categoria_id, [...(itensPorCategoria.get(item.categoria_id) ?? []), itemCompleto])
  }

  const categoriasComItens: CardapioV2CategoriaComItens[] = categorias.map((cat) => ({
    ...cat,
    itens: itensPorCategoria.get(cat.id) ?? [],
    regras: regrasPorCategoria.get(cat.id) ?? [],
  }))

  return { cardapio, categorias: categoriasComItens, alergenos }
}

/** Preço efetivo de um item/variação pro canal — usa o override de canal
 * quando existe, senão cai pro preço base/da variação. */
export function precoPorCanal(precoBase: number, precosCanal: { canal: CanalCardapioV2; preco: number }[], canal: CanalCardapioV2): number {
  return precosCanal.find((p) => p.canal === canal)?.preco ?? precoBase
}

export async function registrarAcessoQr(estabelecimentoId: string): Promise<void> {
  const supabase = createPublicClient()
  await supabase.from('cardapio_v2_qr_acessos').insert({ estabelecimento_id: estabelecimentoId })
}
