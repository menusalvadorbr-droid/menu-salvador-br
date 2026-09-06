'use client'

import { useCallback, useEffect, useState } from 'react'
import { obterOuCriarCardapioPadrao } from '../cardapioRepository'
import { listarCategorias } from '../categoriaRepository'
import type { CardapioV2Cardapio, CardapioV2Categoria } from '../types'

/**
 * Bootstrap do editor: garante que existe 1 cardápio (cria se for o
 * primeiro acesso) e carrega suas categorias. Cada seção do editor
 * (ListaItens, GrupoComplementoEditor, etc.) cuida do próprio estado de
 * item/grupo por conta própria — evita repetir o god-hook de 35 states
 * do CardapioTab.tsx do V1.
 */
export function useCardapioV2Editor(estabelecimentoId: string) {
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [cardapio, setCardapio] = useState<CardapioV2Cardapio | null>(null)
  const [categorias, setCategorias] = useState<CardapioV2Categoria[]>([])
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState<string | null>(null)

  const recarregarCategorias = useCallback(async (cardapioId: string) => {
    const lista = await listarCategorias(cardapioId)
    setCategorias(lista)
    setCategoriaSelecionadaId((atual) => atual && lista.some((c) => c.id === atual) ? atual : lista[0]?.id ?? null)
  }, [])

  useEffect(() => {
    let cancelado = false

    async function bootstrap() {
      setCarregando(true)
      setErro(null)
      try {
        const cardapioPadrao = await obterOuCriarCardapioPadrao(estabelecimentoId)
        if (cancelado) return
        setCardapio(cardapioPadrao)
        await recarregarCategorias(cardapioPadrao.id)
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : 'Erro ao carregar o cardápio')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    bootstrap()
    return () => {
      cancelado = true
    }
  }, [estabelecimentoId, recarregarCategorias])

  return {
    carregando,
    erro,
    cardapio,
    setCardapio,
    categorias,
    categoriaSelecionadaId,
    setCategoriaSelecionadaId,
    recarregarCategorias: () => cardapio && recarregarCategorias(cardapio.id),
  }
}
