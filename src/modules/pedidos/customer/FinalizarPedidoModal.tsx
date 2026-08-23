'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFinalizarPedido } from './useFinalizarPedido'
import { salvarLinkAcompanhamento } from './pedidoAcompanhamentoStorage'
import { BOTAO_PEDIDO_PRIMARIO, BOTAO_PEDIDO_SECUNDARIO } from './estilosBotao'
import type { ItemPedido, TipoPedido } from '../types'
import { useTraducao } from '@/components/public/TraducaoCardapio'

interface FinalizarPedidoModalProps {
  aberto: boolean
  onFechar: () => void
  onSucesso: () => void
  estabelecimentoId: string
  slug: string
  whatsappEstabelecimento?: string
  total: number
  items: ItemPedido[]
  mesaFixa?: string
  mesaIdFixa?: string
}

const OPCOES_TIPO: { valor: TipoPedido; label: string; chave: string; icone: string }[] = [
  { valor: 'mesa', label: 'Estou na mesa', chave: 'opcao_mesa', icone: '🍽️' },
  { valor: 'retirada', label: 'Vou retirar', chave: 'opcao_retirada', icone: '🛍️' },
  { valor: 'entrega', label: 'Entrega', chave: 'opcao_entrega', icone: '🛵' },
]

export default function FinalizarPedidoModal({
  aberto,
  onFechar,
  onSucesso,
  estabelecimentoId,
  slug,
  whatsappEstabelecimento,
  total,
  items,
  mesaFixa,
  mesaIdFixa,
}: FinalizarPedidoModalProps) {
  const [nome, setNome] = useState('')
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(mesaFixa ? 'mesa' : 'retirada')
  const [mesa, setMesa] = useState(mesaFixa || '')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [metodoPagamento, setMetodoPagamento] = useState('Dinheiro')
  const [observacoes, setObservacoes] = useState('')
  const { finalizar, enviando, resultado, pedidoId, erro } = useFinalizarPedido()
  const { traduzirInterface } = useTraducao()

  useEffect(() => {
    if (pedidoId) salvarLinkAcompanhamento(slug, pedidoId)
  }, [pedidoId, slug])

  if (!aberto) return null

  async function handleFinalizar() {
    await finalizar({
      estabelecimentoId,
      whatsappEstabelecimento,
      items,
      total,
      nomeCliente: nome,
      tipoPedido,
      mesa: tipoPedido === 'mesa' ? mesa : undefined,
      // Só manda mesa_id quando o número veio travado do QR escaneado
      // (mesaFixa) — se o cliente digitou o número à mão, não há como
      // saber com certeza a qual mesa cadastrada aquele texto corresponde.
      mesaId: tipoPedido === 'mesa' && mesaFixa ? mesaIdFixa : undefined,
      enderecoEntrega: tipoPedido === 'entrega' ? enderecoEntrega : undefined,
      observacoes,
      metodoPagamento,
    })
  }

  if (resultado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          {resultado === 'online' ? (
            <>
              <div className="mb-2 text-4xl">✅</div>
              <h2 className="text-lg font-bold text-neutral-900">{traduzirInterface('pedido_enviado_titulo', 'Pedido enviado!')}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {traduzirInterface('pedido_enviado_texto', 'O estabelecimento já recebeu seu pedido e vai confirmar em instantes.')}
              </p>
            </>
          ) : (
            <>
              <div className="mb-2 text-4xl">📲</div>
              <h2 className="text-lg font-bold text-neutral-900">{traduzirInterface('pedido_whatsapp_titulo', 'Pedido enviado via WhatsApp')}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {traduzirInterface(
                  'pedido_whatsapp_texto',
                  'O sistema está temporariamente indisponível, então enviamos seu pedido direto pelo WhatsApp do estabelecimento — e ele será sincronizado automaticamente assim que a conexão voltar.'
                )}
              </p>
            </>
          )}
          <div className="mt-5 flex flex-col gap-2">
            {resultado === 'online' && pedidoId && (
              <Link
                href={`/cardapio/${slug}/pedido/${pedidoId}`}
                onClick={() => {
                  onSucesso()
                  onFechar()
                }}
                className={`w-full ${BOTAO_PEDIDO_PRIMARIO}`}
              >
                📍 {traduzirInterface('acompanhar_meu_pedido', 'Acompanhar meu pedido')}
              </Link>
            )}
            <button
              onClick={() => {
                onSucesso()
                onFechar()
              }}
              className={`w-full ${BOTAO_PEDIDO_SECUNDARIO}`}
            >
              {traduzirInterface('fechar', 'Fechar')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-neutral-900">📦 {traduzirInterface('finalizar_pedido', 'Finalizar pedido')}</h2>

        {erro && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('como_vai_ser', 'Como vai ser?')}</label>
            <div className="grid grid-cols-3 gap-2">
              {OPCOES_TIPO.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setTipoPedido(opcao.valor)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs font-medium ${
                    tipoPedido === opcao.valor
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-neutral-200 text-neutral-600'
                  }`}
                >
                  <span className="text-lg">{opcao.icone}</span>
                  {traduzirInterface(opcao.chave, opcao.label)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('seu_nome', 'Seu nome *')}</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
            />
          </div>

          {tipoPedido === 'mesa' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('numero_mesa', 'Número da mesa')}</label>
              <input
                type="text"
                value={mesa}
                onChange={(e) => setMesa(e.target.value)}
                placeholder="Ex: 12"
                disabled={Boolean(mesaFixa)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 disabled:bg-neutral-100"
              />
            </div>
          )}

          {tipoPedido === 'entrega' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('endereco_entrega', 'Endereço de entrega *')}</label>
              <textarea
                value={enderecoEntrega}
                onChange={(e) => setEnderecoEntrega(e.target.value)}
                rows={2}
                placeholder="Rua, número, bairro, complemento..."
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
              />
              <p className="mt-1 text-xs text-neutral-400">
                {traduzirInterface('taxa_entrega_aviso', 'A taxa de entrega, se houver, é combinada direto com o estabelecimento.')}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('forma_pagamento', 'Forma de pagamento')}</label>
            <select
              value={metodoPagamento}
              onChange={(e) => setMetodoPagamento(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
            >
              <option>Dinheiro</option>
              <option>Cartão de débito</option>
              <option>Cartão de crédito</option>
              <option>Pix</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{traduzirInterface('observacoes_label', 'Observações')}</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Troco para R$ 50, sem cebola..."
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
            />
          </div>

          <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-bold text-neutral-900">
            <span>{traduzirInterface('total_label', 'Total')}</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleFinalizar} disabled={enviando} className={`flex-1 ${BOTAO_PEDIDO_PRIMARIO}`}>
              {enviando ? traduzirInterface('enviando', 'Enviando...') : traduzirInterface('confirmar_pedido', 'Confirmar pedido')}
            </button>
            <button onClick={onFechar} className={`flex-1 ${BOTAO_PEDIDO_SECUNDARIO}`}>
              {traduzirInterface('cancelar', 'Cancelar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
