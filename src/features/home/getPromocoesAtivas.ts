import { createClient } from '@/lib/supabase/server'

export interface PromocaoCarrossel {
  id: string
  nome: string
  preco: number | null
  preco_promocional: number | null
  foto_url: string | null
  nomeEstabelecimento: string
  slug: string
}

/**
 * Busca as promoções ativas no servidor (junto com o resto dos dados da
 * home, em paralelo) — antes isso era buscado no cliente via useEffect,
 * o que causava um "pulo" visual depois da página já ter carregado e
 * atrasava a exibição da seção sem necessidade.
 */
export async function getPromocoesAtivas(): Promise<PromocaoCarrossel[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('itens_cardapio')
    .select(`
      id,
      nome,
      preco,
      preco_promocional,
      foto_url,
      categorias (
        menus (
          estabelecimentos ( nome, slug )
        )
      )
    `)
    .eq('promo_status', 'active')
    .not('preco_promocional', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data) return []

  return data
    .map((item: any) => {
      const categoria = Array.isArray(item.categorias) ? item.categorias[0] : item.categorias
      const menu = Array.isArray(categoria?.menus) ? categoria?.menus[0] : categoria?.menus
      const estabelecimento = Array.isArray(menu?.estabelecimentos) ? menu?.estabelecimentos[0] : menu?.estabelecimentos

      return {
        id: item.id,
        nome: item.nome,
        preco: item.preco,
        preco_promocional: item.preco_promocional,
        foto_url: item.foto_url,
        nomeEstabelecimento: estabelecimento?.nome || 'Estabelecimento',
        slug: estabelecimento?.slug || null,
      }
    })
    // Sem slug não tem como montar link nenhum — melhor não mostrar o
    // card do que mostrar um card que leva pra lugar nenhum.
    .filter((p): p is PromocaoCarrossel => Boolean(p.slug))
}
