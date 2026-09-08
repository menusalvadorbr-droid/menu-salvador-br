const PREFIXO_CHAVE = 'menu-salvador:pedidos:'

// Validade do botão rápido "voltar a acompanhar" — depois disso o pedido já
// foi resolvido de sobra (entregue/pago ou esquecido), não faz sentido
// continuar empurrando ele pra tela de acompanhamento. O histórico completo
// (listarPedidosSalvos) usa uma janela bem maior — ali a pessoa já está
// procurando de propósito, não é um empurrão automático.
const VALIDADE_BOTAO_RAPIDO_MS = 12 * 60 * 60 * 1000
const VALIDADE_HISTORICO_MS = 90 * 24 * 60 * 60 * 1000

// Sem conta de cliente (checkout é sempre sem login), o único jeito de
// "lembrar" pedidos anteriores é por navegador/aparelho — some se limpar
// dados do site ou trocar de aparelho. Documentado aqui porque é a razão de
// isso morar em localStorage em vez de numa tabela vinculada a um usuário.
const MAX_PEDIDOS_GUARDADOS = 20

export interface PedidoSalvo {
  pedidoId: string
  criadoEm: number
}

function chave(slug: string): string {
  return PREFIXO_CHAVE + slug
}

function lerLista(slug: string): PedidoSalvo[] {
  try {
    const bruto = localStorage.getItem(chave(slug))
    if (!bruto) return []
    const dado = JSON.parse(bruto)
    return Array.isArray(dado) ? dado : []
  } catch {
    return []
  }
}

/** localStorage pode falhar (modo privado, quota, navegador bloqueando) —
 *  em qualquer um desses casos a pessoa só perde a conveniência de ver o
 *  histórico, não trava o fluxo de pedido. */
export function salvarLinkAcompanhamento(slug: string, pedidoId: string) {
  try {
    const atual = lerLista(slug).filter((p) => p.pedidoId !== pedidoId)
    const nova = [{ pedidoId, criadoEm: Date.now() }, ...atual].slice(0, MAX_PEDIDOS_GUARDADOS)
    localStorage.setItem(chave(slug), JSON.stringify(nova))
  } catch {
    // ignora — ver comentário acima
  }
}

/** Pedido mais recente pra oferecer "voltar a acompanhar" com um clique só
 *  — null se o mais recente já passou da janela curta (ver
 *  VALIDADE_BOTAO_RAPIDO_MS) ou se não há nenhum salvo. */
export function obterPedidoAcompanhadoSalvo(slug: string): string | null {
  const [maisRecente] = lerLista(slug)
  if (!maisRecente) return null
  if (Date.now() - maisRecente.criadoEm > VALIDADE_BOTAO_RAPIDO_MS) return null
  return maisRecente.pedidoId
}

/** Histórico completo (mais recente primeiro) pra tela "Meus pedidos" —
 *  janela bem maior que o botão rápido, e limpa da lista salva qualquer
 *  entrada já expirada (não só filtra na leitura), pra lista não crescer
 *  sem limite com pedido antigo de meses atrás. */
export function listarPedidosSalvos(slug: string): PedidoSalvo[] {
  try {
    const validos = lerLista(slug).filter((p) => Date.now() - p.criadoEm <= VALIDADE_HISTORICO_MS)
    localStorage.setItem(chave(slug), JSON.stringify(validos))
    return validos
  } catch {
    return []
  }
}
