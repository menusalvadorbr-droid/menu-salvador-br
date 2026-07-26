import type { NovoPedidoInput } from './types'

const CHAVE_FILA = 'menu_salvador_fila_pedidos_pendentes'

export interface PedidoPendente {
  idLocal: string
  input: NovoPedidoInput
  criadoEm: string
  tentativas: number
}

/**
 * Fila de contingência baseada em localStorage. Guarda pedidos que não
 * conseguiram ser gravados no Supabase (sem internet, banco fora do ar,
 * etc.) para tentar de novo automaticamente assim que a conexão voltar.
 *
 * Usa localStorage (não IndexedDB) de propósito: é síncrono, não precisa
 * de nenhuma dependência nova, e o volume de pedidos pendentes de um único
 * cliente em contingência é sempre pequeno (poucos KBs).
 */
function ler(): PedidoPendente[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE_FILA)
    return bruto ? JSON.parse(bruto) : []
  } catch {
    return []
  }
}

function escrever(fila: PedidoPendente[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CHAVE_FILA, JSON.stringify(fila))
}

export function adicionarPendente(input: NovoPedidoInput): PedidoPendente {
  const pendente: PedidoPendente = {
    idLocal: crypto.randomUUID(),
    input,
    criadoEm: new Date().toISOString(),
    tentativas: 0,
  }
  const fila = ler()
  fila.push(pendente)
  escrever(fila)
  return pendente
}

export function listarPendentes(): PedidoPendente[] {
  return ler()
}

export function removerPendente(idLocal: string) {
  escrever(ler().filter((p) => p.idLocal !== idLocal))
}

export function incrementarTentativa(idLocal: string) {
  escrever(
    ler().map((p) => (p.idLocal === idLocal ? { ...p, tentativas: p.tentativas + 1 } : p))
  )
}

export function temPendentes(): boolean {
  return ler().length > 0
}
