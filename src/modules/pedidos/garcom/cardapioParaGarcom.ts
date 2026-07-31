import { createClient } from '@/lib/supabase/client'

export interface ItemCardapioGarcom {
  id: string
  nome: string
  preco: number
  preco_promocional: number | null
  disponivel: boolean
}

export interface CategoriaComItens {
  id: string
  nome: string
  itens: ItemCardapioGarcom[]
}

export async function listarCardapioParaGarcom(estabelecimentoId: string): Promise<CategoriaComItens[]> {
  const supabase = createClient()

  // Mesmo ajuste já feito em CardapioTab.tsx: .single() exige exatamente 1
  // linha (quebra com PGRST116 se houver mais de um menu) e a coluna
  // `ativo` pode nem existir — usa .limit(1) + primeiro item em vez disso.
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
    .select('id, nome, ordem, itens_cardapio(id, nome, preco, preco_promocional, disponivel, ordem)')
    .eq('menu_id', menu.id)
    .order('ordem', { ascending: true })

  return (categorias || []).map((cat: any) => ({
    id: cat.id,
    nome: cat.nome,
    itens: (cat.itens_cardapio || [])
      .filter((i: any) => i.disponivel !== false)
      .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0)),
  }))
}
