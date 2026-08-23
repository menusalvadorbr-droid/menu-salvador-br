/**
 * Catálogo dos recursos que um plano pode incluir — usado tanto no editor
 * de planos (/admin/planos, checkboxes) quanto na checagem de acesso do
 * estabelecimento (herdada do plano atribuído pelo admin, não é toggle que
 * o dono liga sozinho). Novo recurso controlado por plano = nova entrada
 * aqui, sem precisar de coluna nova no banco (recursos já é um array).
 */
export interface RecursoPlano {
  slug: string
  label: string
  descricao: string
}

export const RECURSOS_PLANO: RecursoPlano[] = [
  {
    slug: 'qr_mesa',
    label: 'QR por mesa',
    descricao: 'Gera um QR Code individual por mesa — o pedido do cliente já chega identificado com a mesa, sem precisar digitar o número.',
  },
  {
    slug: 'variacoes_tamanho',
    label: 'Tamanhos/variações de preço',
    descricao: 'Permite cadastrar preços diferentes por tamanho (P/M/G) pro mesmo item.',
  },
  {
    slug: 'grupos_complementos',
    label: 'Grupos de complementos',
    descricao: 'Acompanhamentos, adicionais e opções com mínimo/máximo de seleção por item.',
  },
  {
    slug: 'carrinho_pedidos',
    label: 'Carrinho de pedidos',
    descricao: 'Cliente monta pedido e envia direto pelo cardápio, sem precisar chamar o garçom pra cada item.',
  },
  {
    slug: 'idiomas',
    label: 'Idiomas (tradução)',
    descricao: 'Cardápio disponível em inglês, francês e espanhol, além do português.',
  },
]

export function recursoLabel(slug: string): string {
  return RECURSOS_PLANO.find((r) => r.slug === slug)?.label || slug
}

export function planoTemRecurso(recursos: string[] | null | undefined, slug: string): boolean {
  return !!recursos?.includes(slug)
}
