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

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('ativo', true)
    .single()

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
