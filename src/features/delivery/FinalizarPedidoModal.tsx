// src/features/delivery/FinalizarPedidoModal.tsx
'use client'

import { useState } from 'react'

interface FinalizarPedidoModalProps {
  aberto: boolean
  onFechar: () => void
  total: number
  itens: { nome: string; quantidade: number; preco: number }[]
  whatsappEstabelecimento: string
}

export default function FinalizarPedidoModal({
  aberto,
  onFechar,
  total,
  itens,
  whatsappEstabelecimento,
}: FinalizarPedidoModalProps) {
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!aberto) return null

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const enviarPedido = () => {
    if (!nome.trim()) {
      alert('Por favor, informe seu nome.')
      return
    }
    if (!endereco.trim()) {
      alert('Por favor, informe seu endereço de entrega.')
      return
    }

    setEnviando(true)

    let mensagem = `🛵 *NOVO PEDIDO* 🛵\n\n`
    mensagem += `*Cliente:* ${nome}\n`
    mensagem += `*Endereço:* ${endereco}\n`
    if (observacao.trim()) {
      mensagem += `*Observação:* ${observacao}\n`
    }
    mensagem += `\n*Itens do Pedido:*\n`
    itens.forEach((item) => {
      const subtotal = item.preco * item.quantidade
      mensagem += `- ${item.quantidade}x ${item.nome} - R$ ${formatarPreco(subtotal)}\n`
    })
    mensagem += `\n*Total:* R$ ${formatarPreco(total)}`

    const numeroWhatsApp = whatsappEstabelecimento.replace(/\D/g, '')
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
    setEnviando(false)
    onFechar()
  }

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onFechar}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Finalizar Pedido</h2>
              <button
                onClick={onFechar}
                className="text-2xl text-gray-500 hover:text-gray-700"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço de Entrega *
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Rua, número, bairro, complemento"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: sem cebola, mais bem passado, ponto de referência..."
                />
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total do Pedido</span>
                <span>R$ {formatarPreco(total)}</span>
              </div>
            </div>

            <button
              onClick={enviarPedido}
              disabled={enviando}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : '📲 Enviar Pedido via WhatsApp'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}