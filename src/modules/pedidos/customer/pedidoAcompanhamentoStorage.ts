const PREFIXO_CHAVE = 'menu-salvador:pedido-acompanhamento:'

// Depois disso o pedido já foi resolvido de sobra (entregue/pago ou
// esquecido) — não faz sentido continuar oferecendo "voltar a acompanhar".
const VALIDADE_MS = 12 * 60 * 60 * 1000

interface LinkSalvo {
  pedidoId: string
  criadoEm: number
}

/** localStorage pode falhar (modo privado, quota, navegador bloqueando) —
 *  em qualquer um desses casos a pessoa só perde a conveniência de voltar
 *  direto, não trava o fluxo de pedido. */
export function salvarLinkAcompanhamento(slug: string, pedidoId: string) {
  try {
    const dado: LinkSalvo = { pedidoId, criadoEm: Date.now() }
    localStorage.setItem(PREFIXO_CHAVE + slug, JSON.stringify(dado))
  } catch {
    // ignora — ver comentário acima
  }
}

export function obterPedidoAcompanhadoSalvo(slug: string): string | null {
  try {
    const bruto = localStorage.getItem(PREFIXO_CHAVE + slug)
    if (!bruto) return null
    const dado: LinkSalvo = JSON.parse(bruto)
    if (Date.now() - dado.criadoEm > VALIDADE_MS) {
      localStorage.removeItem(PREFIXO_CHAVE + slug)
      return null
    }
    return dado.pedidoId
  } catch {
    return null
  }
}
