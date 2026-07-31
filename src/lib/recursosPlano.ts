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
]

export function recursoLabel(slug: string): string {
  return RECURSOS_PLANO.find((r) => r.slug === slug)?.label || slug
}

export function planoTemRecurso(recursos: string[] | null | undefined, slug: string): boolean {
  return !!recursos?.includes(slug)
}
