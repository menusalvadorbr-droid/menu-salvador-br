'use client'

import { useEffect, useState, useCallback } from 'react'
import { obterSessaoAberta, abrirCaixa, fecharCaixa, resumoSessao } from '../caixaRepository'
import type { SessaoCaixa, ResumoSessaoCaixa } from '../types'

export function useCaixa(estabelecimentoId: string) {
  const [sessaoAberta, setSessaoAberta] = useState<SessaoCaixa | null>(null)
  const [resumo, setResumo] = useState<ResumoSessaoCaixa | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    try {
      const sessao = await obterSessaoAberta(estabelecimentoId)
      setSessaoAberta(sessao)
      setResumo(sessao ? await resumoSessao(sessao.id) : null)
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(carregar, 10000) // atualiza o resumo a cada 10s enquanto o caixa está aberto
    return () => clearInterval(intervalo)
  }, [carregar])

  async function abrir(valorAbertura: number, observacoes?: string) {
    await abrirCaixa(estabelecimentoId, valorAbertura, observacoes)
    await carregar()
  }

  async function fechar(valorInformado: number) {
    if (!sessaoAberta) return null
    const sessaoFechada = await fecharCaixa(sessaoAberta.id, valorInformado)
    await carregar()
    return sessaoFechada
  }

  return { sessaoAberta, resumo, carregando, abrir, fechar, atualizar: carregar }
}
