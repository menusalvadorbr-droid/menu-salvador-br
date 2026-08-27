'use client'

import { useState, useCallback } from 'react'
import type { ItemPedido as ItemSacola } from '../types'

// Duas adições do mesmo prato só viram a mesma linha (e só então
// incrementam quantidade) se tiverem a mesma variação e os mesmos
// complementos — senão "Pizza G + borda recheada" e "Pizza G" sozinha
// se fundiriam numa linha só, perdendo a customização de uma delas.
function chaveLinha(item: Omit<ItemSacola, 'quantidade' | 'linhaId'>): string {
  const variacao = item.variacao?.id || ''
  const complementos = (item.complementos || [])
    .map(c => c.opcaoId)
    .sort()
    .join(',')
  return `${item.id}::${variacao}::${complementos}`
}

export function useSacola(itensIniciais?: ItemSacola[]) {
  const [itens, setItens] = useState<ItemSacola[]>(itensIniciais || [])

  const adicionarItem = useCallback((item: Omit<ItemSacola, 'quantidade' | 'linhaId'>) => {
    const linhaId = chaveLinha(item)
    setItens(prev => {
      const existente = prev.find(i => i.linhaId === linhaId)
      if (existente) {
        return prev.map(i =>
          i.linhaId === linhaId ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      }
      return [...prev, { ...item, quantidade: 1, observacao: '', linhaId }]
    })
  }, [])

  const removerItem = useCallback((linhaId: string) => {
    setItens(prev => prev.filter(i => i.linhaId !== linhaId))
  }, [])

  const alterarQuantidade = useCallback((linhaId: string, delta: number) => {
    setItens(prev =>
      prev.map(i => {
        if (i.linhaId !== linhaId) return i
        const novaQuantidade = i.quantidade + delta
        return novaQuantidade <= 0 ? i : { ...i, quantidade: novaQuantidade }
      }).filter(i => i.quantidade > 0)
    )
  }, [])

  const limparSacola = useCallback(() => setItens([]), [])

  const total = itens.reduce((acc, item) => {
    const preco = item.preco_promocional && item.preco_promocional < item.preco
      ? item.preco_promocional
      : item.preco
    return acc + preco * item.quantidade
  }, 0)

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0)

  return {
    itens,
    adicionarItem,
    removerItem,
    alterarQuantidade,
    limparSacola,
    total,
    totalItens,
  }
}