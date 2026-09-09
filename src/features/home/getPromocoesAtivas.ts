import { createClient } from '@/lib/supabase/server'
import { resolverEstadoExibicao } from '@/modules/cardapioV2/regrasExibicao'
import type { CardapioV2RegraExibicao } from '@/modules/cardapioV2/types'

export interface PromocaoCarrossel {
  id: string
  nome: string
  preco: number | null
  preco_promocional: number | null
  foto_url: string | null
  nomeEstabelecimento: string
  slug: string
}

interface ItemComRegraBruto {
  id: string
  nome: string
  preco_base: number
  foto_url: string | null
  cardapio_v2_regras_exibicao: CardapioV2RegraExibicao[]
  cardapio_v2_categorias: {
    cardapio_v2_cardapios: {
      estabelecimentos: { nome: string; nome_fantasia: string | null; slug: string } | null
    } | null
  } | null
}

/**
 * Busca as promoções ativas do Cardápio V2 (não mais itens_cardapio do
 * V1) — feito no servidor, junto com o resto da home. Item entra aqui só
 * se tiver uma regra `tipo='promocao'` ativa (ver
 * cardapio_v2_regras_exibicao) — a janela de validade (data/dia-da-semana/
 * horário) é sempre reavaliada aqui via resolverEstadoExibicao, que o V1
 * nunca chegou a checar (só olhava um status fixo).
 */
export async function getPromocoesAtivas(): Promise<PromocaoCarrossel[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cardapio_v2_itens')
    .select(
      `
      id,
      nome,
      preco_base,
      foto_url,
      cardapio_v2_regras_exibicao!inner(*),
      cardapio_v2_categorias (
        cardapio_v2_cardapios (
          estabelecimentos ( nome, nome_fantasia, slug )
        )
      )
    `
    )
    .eq('ativo', true)
    .eq('cardapio_v2_regras_exibicao.tipo', 'promocao')
    .eq('cardapio_v2_regras_exibicao.ativo', true)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error || !data) return []

  const agora = new Date()
  const resultado: PromocaoCarrossel[] = []

  for (const item of data as unknown as ItemComRegraBruto[]) {
    const estado = resolverEstadoExibicao(item.cardapio_v2_regras_exibicao, agora)
    if (!estado.disponivel || estado.precoPromocional == null) continue

    const estabelecimento = item.cardapio_v2_categorias?.cardapio_v2_cardapios?.estabelecimentos
    // Sem slug não tem como montar link nenhum — melhor não mostrar o
    // card do que mostrar um card que leva pra lugar nenhum.
    if (!estabelecimento?.slug) continue

    resultado.push({
      id: item.id,
      nome: item.nome,
      preco: item.preco_base,
      preco_promocional: estado.precoPromocional,
      foto_url: item.foto_url,
      nomeEstabelecimento: estabelecimento.nome_fantasia || estabelecimento.nome || 'Estabelecimento',
      slug: estabelecimento.slug,
    })

    if (resultado.length >= 10) break
  }

  return resultado
}
