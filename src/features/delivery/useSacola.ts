'use client'

import { useState, useCallback } from 'react'

interface ItemSacola {
  id: string
  nome: string
  preco: number
  preco_promocional?: number
  quantidade: number
  observacao?: string
}

export function useSacola() {
  const [itens, setItens] = useState<ItemSacola[]>([])

  const adicionarItem = useCallback((item: Omit<ItemSacola, 'quantidade'>) => {
    setItens(prev => {
      const existente = prev.find(i => i.id === item.id)
      if (existente) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      }
      return [...prev, { ...item, quantidade: 1, observacao: '' }]
    })
  }, [])

  const removerItem = useCallback((id: string) => {
    setItens(prev => prev.filter(i => i.id !== id))
  }, [])

  const alterarQuantidade = useCallback((id: string, delta: number) => {
    setItens(prev =>
      prev.map(i => {
        if (i.id !== id) return i
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