'use client'

import { useState, useCallback } from 'react'
import { criarPedido } from '../ordersRepository'
import { normalizarTelefone } from '@/lib/telefone'
import type { ItemPedido, TipoPedido } from '../types'

interface DadosFinalizacao {
  estabelecimentoId: string
  whatsappEstabelecimento?: string
  items: ItemPedido[]
  total: number
  nomeCliente: string
  telefone?: string
  tipoPedido: TipoPedido
  mesa?: string
  mesaId?: string
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
    if (item.variacao) {
      mensagem += `       Tamanho: ${item.variacao.nome}\n`
    }
    if (item.complementos && item.complementos.length > 0) {
      mensagem += `       Complementos: ${item.complementos.map((c) => c.opcaoNome).join(', ')}\n`
    }
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
  const [pedidoId, setPedidoId] = useState<string | null>(null)
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

    // Telefone é obrigatório pra entrega (contato do entregador) e pra Pix
    // (confirmação manual de pagamento na Fila do Operador) — nos demais
    // casos é opcional, mas ainda coletado se o cliente preencher.
    if ((dados.tipoPedido === 'entrega' || dados.metodoPagamento === 'Pix') && !dados.telefone?.trim()) {
      setErro('Informe seu telefone para continuar.')
      setEnviando(false)
      return
    }

    const resposta = await criarPedido({
      estabelecimento_id: dados.estabelecimentoId,
      items: dados.items,
      total: dados.total,
      nome_cliente: dados.nomeCliente,
      telefone: dados.telefone?.trim() ? normalizarTelefone(dados.telefone) : undefined,
      tipo_pedido: dados.tipoPedido,
      mesa: dados.mesa,
      mesa_id: dados.mesaId,
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

    // Só existe link de acompanhamento pra pedido gravado de verdade —
    // em contingência o pedido ainda está só na fila local, sem id real
    // até sincronizar.
    setPedidoId(resposta.pedidoId || null)
    setResultado(resposta.modo)
    setEnviando(false)
  }, [])

  return { finalizar, enviando, resultado, pedidoId, erro }
}
