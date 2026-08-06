import type { ItemCardapioBruto } from './resolverItemCardapio'

// Cache persistente (localStorage) do cardápio público — categorias e
// itens já buscados sobrevivem ao fechamento da aba, sem prazo de
// validade por tempo. Frescor é garantido por outro mecanismo (checagem
// de entrada + Realtime, ver useCardapioPublico.ts), não por expiração
// aqui — daí não ter nenhum campo tipo "expiraEm" nesta estrutura.

export interface CategoriaCache {
  id: string
  nome: string
  ordem: number
  foto_url: string | null
  updated_at: string
}

export interface CardapioCache {
  versao: number
  categorias: CategoriaCache[]
  itensPorCategoria: Record<string, ItemCardapioBruto[]>
}

// Muda se a estrutura acima mudar de formato — cache de versão antiga é
// tratado como inexistente em vez de tentar migrar/adivinhar o shape.
const VERSAO_CACHE = 1

function chaveCache(estabelecimentoId: string): string {
  return `cardapio-cache:v${VERSAO_CACHE}:${estabelecimentoId}`
}

function cacheVazio(): CardapioCache {
  return { versao: VERSAO_CACHE, categorias: [], itensPorCategoria: {} }
}

/** id -> updated_at de todo item já em cache, derivado (não guardado à
 *  parte) — cada item já carrega seu próprio updated_at, então manter um
 *  segundo mapa em paralelo só criaria chance dos dois ficarem
 *  inconsistentes entre si. */
export function derivarRefItens(itensPorCategoria: Record<string, ItemCardapioBruto[]>): Record<string, string> {
  const ref: Record<string, string> = {}
  for (const itens of Object.values(itensPorCategoria)) {
    for (const item of itens) ref[item.id] = item.updated_at
  }
  return ref
}

/** Nunca lança — localStorage pode estar indisponível (modo privado em
 *  alguns navegadores, quota estourada) ou o JSON pode estar corrompido;
 *  nesses casos, trata como se não houvesse cache nenhum. */
export function lerCache(estabelecimentoId: string): CardapioCache {
  try {
    const bruto = localStorage.getItem(chaveCache(estabelecimentoId))
    if (!bruto) return cacheVazio()
    const dados = JSON.parse(bruto)
    if (dados?.versao !== VERSAO_CACHE) return cacheVazio()
    return dados as CardapioCache
  } catch {
    return cacheVazio()
  }
}

export function escreverCache(estabelecimentoId: string, cache: CardapioCache): void {
  try {
    localStorage.setItem(chaveCache(estabelecimentoId), JSON.stringify(cache))
  } catch {
    // Quota estourada ou localStorage bloqueado — o cardápio continua
    // funcionando normalmente, só sem persistir entre visitas.
  }
}
