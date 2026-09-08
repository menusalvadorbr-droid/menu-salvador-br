import type { VariacaoResolvida, GrupoResolvido } from '@/modules/pedidos/customer/tiposSelecao'
import type { CardapioV2GrupoComplementoResolvido, CardapioV2ItemCompleto } from './types'

// Ponte entre o domínio do Cardápio V2 (variações/grupos de complemento) e o
// formato genérico que o carrinho (src/modules/pedidos/customer/*, reusado
// tal como está do V1) espera — o carrinho não sabe nada sobre
// cardapio_v2_*, só sobre VariacaoResolvida/GrupoResolvido.

export function variacoesParaCarrinho(item: CardapioV2ItemCompleto): VariacaoResolvida[] {
  return item.variacoes.map((v) => ({ id: v.id, nome: v.nome, preco: v.preco }))
}

// O modelo do V2 não tem grupo condicional (opcao_grupo_complemento do V1,
// onde escolher uma opção libera outro grupo) — gruposExtras fica sempre
// vazio, o que o SeletorItemModal já trata sem recursão nenhuma.
export function gruposParaCarrinho(
  item: CardapioV2ItemCompleto,
  gruposDisponiveis: CardapioV2GrupoComplementoResolvido[]
): GrupoResolvido[] {
  return item.grupos_complemento_ids
    .map((id) => gruposDisponiveis.find((g) => g.id === id))
    .filter((g): g is CardapioV2GrupoComplementoResolvido => !!g)
    .map((grupo) => ({
      id: grupo.id,
      nome: grupo.nome,
      selecaoMinima: grupo.minimo,
      selecaoMaxima: grupo.maximo,
      opcoes: grupo.opcoes.map((opcao) => ({
        id: opcao.id,
        nome: opcao.nome,
        precoAdicional: opcao.preco_adicional,
        exibirPreco: opcao.preco_adicional > 0,
        gruposExtras: [],
      })),
    }))
}
