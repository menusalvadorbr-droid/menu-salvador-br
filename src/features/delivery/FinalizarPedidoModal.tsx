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
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [pagamento, setPagamento] = useState('Dinheiro')
  const [observacao, setObservacao] = useState('')

  if (!aberto) return null

  const formatarTelefone = (value: string) => {
    // Remove tudo que não é dígito
    const raw = value.replace(/\D/g, '')
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length <= 11) {
      setTelefone(raw)
    }
  }

  const gerarMensagem = () => {
    let mensagem = `🛵 *NOVO PEDIDO DELIVERY* 🛵\n\n`
    mensagem += `━━━━━━━━━━━━━━━━━━\n`
    mensagem += `👤 *Cliente:* ${nome}\n`
    mensagem += `📞 *Telefone:* ${formatarTelefone(telefone)}\n`
    mensagem += `📍 *Endereço:* ${endereco}\n`
    mensagem += `💳 *Pagamento:* ${pagamento}\n`
    if (observacao) {
      mensagem += `📝 *Observação:* ${observacao}\n`
    }
    mensagem += `\n━━━━━━━━━━━━━━━━━━\n`
    mensagem += `📋 *ITENS DO PEDIDO*\n`
    mensagem += `━━━━━━━━━━━━━━━━━━\n\n`
    itens.forEach((item, index) => {
      const subtotal = (item.preco * item.quantidade).toFixed(2)
      mensagem += `${index + 1}️⃣  *${item.quantidade}x*  ${item.nome}\n`
      mensagem += `       R$ ${item.preco.toFixed(2)} cada  |  Subtotal: R$ ${subtotal}\n\n`
    })
    mensagem += `━━━━━━━━━━━━━━━━━━\n`
    mensagem += `💰 *TOTAL DO PEDIDO: R$ ${total.toFixed(2)}*\n`
    mensagem += `━━━━━━━━━━━━━━━━━━\n\n`
    mensagem += `📱 _Pedido enviado via menu.salvador.br_\n`
    mensagem += `⏰ _Aguardando confirmação do estabelecimento_`
    return mensagem
  }

  const enviarWhatsApp = () => {
    if (!nome.trim()) {
      alert('Por favor, informe seu nome.')
      return
    }
    if (!telefone.trim() || telefone.length < 10) {
      alert('Por favor, informe um telefone válido (com DDD).')
      return
    }
    if (!endereco.trim()) {
      alert('Por favor, informe o endereço de entrega.')
      return
    }

    const mensagem = gerarMensagem()
    const numeroLimpo = whatsappEstabelecimento?.replace(/\D/g, '') || ''
    if (!numeroLimpo) {
      alert('Número de WhatsApp do estabelecimento não configurado.')
      return
    }
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
    onFechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-bold mb-4">📦 Finalizar Pedido</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone (com DDD) *</label>
            <input
              type="text"
              value={formatarTelefone(telefone)}
              onChange={handleTelefoneChange}
              placeholder="(71) 99999-9999"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endereço de entrega *</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Forma de pagamento</label>
            <select
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option>Dinheiro</option>
              <option>Cartão de débito</option>
              <option>Cartão de crédito</option>
              <option>Pix</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
              placeholder="Troco para R$ 50, ponto de referência..."
            />
          </div>

          {/* Preview da mensagem */}
          <div className="bg-gray-100 p-3 rounded-lg mt-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">📱 Preview da mensagem:</p>
            <div className="text-xs text-gray-700 whitespace-pre-line font-mono max-h-40 overflow-auto">
              {gerarMensagem()}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={enviarWhatsApp}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              💬 Enviar via WhatsApp
            </button>
            <button
              onClick={onFechar}
              className="flex-1 border py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}