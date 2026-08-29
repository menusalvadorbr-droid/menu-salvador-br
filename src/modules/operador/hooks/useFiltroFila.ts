'use client'

import { useState } from 'react'

const LIMITE_PARA_BUSCA = 10

/** Busca local por texto nas seções da Fila do Operador — extraído de
 *  SecaoPixAguardando.tsx/SecaoValidarEntrega.tsx, que tinham a mesma
 *  lógica de filtro copiada. `bate` decide se um item corresponde ao
 *  termo (já normalizado: trim + lowercase) — mantém exatamente o
 *  critério de cada seção (código + nome do cliente) sem impor um único
 *  formato de busca. Campo de busca só faz sentido acima de um certo
 *  volume — `mostrarBusca` usa a contagem total, não a já filtrada. */
export function useFiltroFila<T>(itens: T[], bate: (item: T, termo: string) => boolean) {
  const [filtro, setFiltro] = useState('')
  const termo = filtro.trim().toLowerCase()
  const itensFiltrados = termo ? itens.filter((item) => bate(item, termo)) : itens

  return {
    filtro,
    setFiltro,
    itensFiltrados,
    filtroAtivo: termo !== '',
    mostrarBusca: itens.length > LIMITE_PARA_BUSCA,
  }
}
