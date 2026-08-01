'use client'

import { useEffect, useState, useCallback } from 'react'
import { listarFornecedores, criarFornecedor, removerFornecedor } from '../fornecedoresRepository'
import type { Fornecedor, NovoFornecedorInput } from '../types'

export function useFornecedores(estabelecimentoId: string) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      setFornecedores(await listarFornecedores(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function adicionar(input: NovoFornecedorInput) {
    try {
      await criarFornecedor(estabelecimentoId, input)
      await carregar()
    } catch (err) {
      alert(`Não foi possível criar o fornecedor: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function remover(id: string) {
    const anterior = fornecedores
    setFornecedores((prev) => prev.filter((f) => f.id !== id))
    try {
      await removerFornecedor(id)
    } catch (err) {
      setFornecedores(anterior)
      alert(`Não foi possível remover o fornecedor: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return { fornecedores, carregando, adicionar, remover }
}
