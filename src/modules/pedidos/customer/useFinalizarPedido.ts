'use client'

import { useState, useCallback } from 'react'
import { criarPedido } from '../ordersRepository'
import type { ItemPedido, TipoPedido } from '../types'

interface DadosFinalizacao {
  estabelecimentoId: string
  whatsappEstabelecimento?: string
  items: ItemPedido[]
  total: number
  nomeCliente: string
  tipoPedido: TipoPedido
  mesa?: string
  enderecoEntrega?: string
  observacoes?: string
  metodoPagamento?: string
}

const ETIQUETA_TIPO: Record<TipoPedido, string> = {
  mesa: 'Comer no local',
  balcao: 'Balcão',
  retirada: 'Retirada',
  entrega: 'Entrega',
}

function montarMensagemWhatsApp(dados: DadosFinalizacao): string {
  let mensagem = `🍽️ *NOVO PEDIDO* 🍽️\n\n`
  mensagem += `━━━━━━━━━━━━━━━━━━\n`
  mensagem += `👤 *Cliente:* ${dados.nomeCliente}\n`
  mensagem += `📦 *Tipo:* ${ETIQUETA_TIPO[dados.tipoPedido]}\n`
  if (dados.mesa) mensagem += `🪑 *Mesa:* ${dados.mesa}\n`
  if (dados.enderecoEntrega) mensagem += `📍 *Endereço:* ${dados.enderecoEntrega}\n`
  if (dados.metodoPagamento) mensagem += `💳 *Pagamento:* ${dados.metodoPagamento}\n`
  if (dados.observacoes) mensagem += `📝 *Observação:* ${dados.observacoes}\n`
  mensagem += `\n━━━━━━━━━━━━━━━━━━\n📋 *ITENS DO PEDIDO*\n━━━━━━━━━━━━━━━━━━\n\n`
  dados.items.forEach((item, i) => {
    const subtotal = (item.preco * item.quantidade).toFixed(2)
    mensagem += `${i + 1}️⃣  *${item.quantidade}x*  ${item.nome}\n`
    mensagem += `       R$ ${item.preco.toFixed(2)} cada  |  Subtotal: R$ ${subtotal}\n\n`
  })
  mensagem += `━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: R$ ${dados.total.toFixed(2)}*\n━━━━━━━━━━━━━━━━━━\n\n`
  mensagem += `⚠️ _Pedido enviado em modo de contingência (sistema fora do ar)_`
  return mensagem
}

export function abrirWhatsApp(dados: DadosFinalizacao) {
  const numeroLimpo = dados.whatsappEstabelecimento?.replace(/\D/g, '') || ''
  if (!numeroLimpo) return false
  const mensagem = montarMensagemWhatsApp(dados)
  window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank')
  return true
}

export function useFinalizarPedido() {
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<'online' | 'contingencia' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const finalizar = useCallback(async (dados: DadosFinalizacao) => {
    setEnviando(true)
    setErro(null)

    if (!dados.nomeCliente.trim()) {
      setErro('Informe seu nome para continuar.')
      setEnviando(false)
      return
    }

    if (dados.tipoPedido === 'entrega' && !dados.enderecoEntrega?.trim()) {
      setErro('Informe o endereço de entrega.')
      setEnviando(false)
      return
    }

    const resposta = await criarPedido({
      estabelecimento_id: dados.estabelecimentoId,
      items: dados.items,
      total: dados.total,
      nome_cliente: dados.nomeCliente,
      tipo_pedido: dados.tipoPedido,
      mesa: dados.mesa,
      endereco_entrega: dados.enderecoEntrega,
      observacoes: dados.observacoes,
      metodo_pagamento: dados.metodoPagamento,
    })

    // Modo de contingência: o pedido já está seguro na fila local (será
    // sincronizado sozinho), mas avisamos o estabelecimento na hora via
    // WhatsApp para não haver atraso no atendimento.
    if (resposta.modo === 'contingencia') {
      abrirWhatsApp(dados)
    }

    setResultado(resposta.modo)
    setEnviando(false)
  }, [])

  return { finalizar, enviando, resultado, erro }
}
