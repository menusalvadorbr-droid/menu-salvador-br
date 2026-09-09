import { buscarCardapioPublico, precoPorCanal } from '@/modules/cardapioV2/publicoRepository'
import { resolverEstadoExibicao } from '@/modules/cardapioV2/regrasExibicao'
import { variacoesParaCarrinho, gruposParaCarrinho } from '@/modules/cardapioV2/carrinhoAdapter'
import type { VariacaoResolvida, GrupoResolvido } from '../customer/tiposSelecao'

export interface ItemCardapioGarcom {
  id: string
  nome: string
  preco: number
  preco_promocional: number | null
  // Pré-resolvidos aqui (não no componente de UI) — item sem nenhum dos
  // dois adiciona direto na sacola; item com qualquer um abre o mesmo
  // seletor que o carrinho de delivery do Cardápio V2 já usa (ver
  // SeletorCardapioGarcom.tsx).
  variacoes: VariacaoResolvida[]
  grupos: GrupoResolvido[]
}

export interface CategoriaComItens {
  id: string
  nome: string
  itens: ItemCardapioGarcom[]
}

/**
 * Cardápio pro garçom/balcão/caixa — lê o Cardápio V2 (canal "presencial"),
 * não mais menus/categorias/itens_cardapio do V1. Reaproveita a mesma
 * leitura pública (buscarCardapioPublico) e as mesmas regras de
 * disponibilidade/promoção que a página pública usa, pra nunca divergir do
 * que o cliente vê. `disponivel`/`destaque` de categoria e item já são
 * resolvidos aqui — quem chama só recebe o que pode ser vendido agora.
 */
export async function listarCardapioParaGarcom(estabelecimentoId: string): Promise<CategoriaComItens[]> {
  const publico = await buscarCardapioPublico(estabelecimentoId, 'presencial')
  if (!publico) return []

  const agora = new Date()

  return publico.categorias
    .filter((categoria) => resolverEstadoExibicao(categoria.regras, agora).disponivel)
    .map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      itens: categoria.itens
        .filter((item) => resolverEstadoExibicao(item.regras, agora).disponivel)
        .map((item) => {
          const estado = resolverEstadoExibicao(item.regras, agora)
          return {
            id: item.id,
            nome: item.nome,
            preco: precoPorCanal(item.preco_base, item.precos_canal, 'presencial'),
            preco_promocional: estado.precoPromocional,
            variacoes: variacoesParaCarrinho(item),
            grupos: gruposParaCarrinho(item, publico.gruposComplemento),
          }
        }),
    }))
}
