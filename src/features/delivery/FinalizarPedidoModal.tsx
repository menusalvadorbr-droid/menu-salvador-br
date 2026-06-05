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

  const gerarMensagem = () => {
    // Cabeçalho
    let mensagem = `🛵 *NOVO PEDIDO DELIVERY* 🛵%0A%0A`
    
    // Dados do cliente
    mensagem += `━━━━━━━━━━━━━━━━━━%0A`
    mensagem += `👤 *Cliente:* ${nome}%0A`
    mensagem += `📞 *Telefone:* ${telefone}%0A`
    mensagem += `📍 *Endereço:* ${endereco}%0A`
    mensagem += `💳 *Pagamento:* ${pagamento}%0A`
    
    if (observacao) {
      mensagem += `📝 *Obs:* ${observacao}%0A`
    }
    
    // Itens do pedido
    mensagem += `%0A━━━━━━━━━━━━━━━━━━%0A`
    mensagem += `📋 *ITENS DO PEDIDO*%0A`
    mensagem += `━━━━━━━━━━━━━━━━━━%0A%0A`
    
    itens.forEach((item, index) => {
      const subtotal = (item.preco * item.quantidade).toFixed(2)
      mensagem += `${index + 1}️⃣  *${item.quantidade}x*  ${item.nome}%0A`
      mensagem += `       R$ ${item.preco.toFixed(2)} cada  |  Subtotal: R$ ${subtotal}%0A%0A`
    })
    
    // Total
    mensagem += `━━━━━━━━━━━━━━━━━━%0A`
    mensagem += `💰 *TOTAL DO PEDIDO: R$ ${total.toFixed(2)}*%0A`
    mensagem += `━━━━━━━━━━━━━━━━━━%0A%0A`
    
    // Rodapé
    mensagem += `📱 _Pedido enviado via menu.salvador.br_%0A`
    mensagem += `⏰ _Aguardando confirmação do estabelecimento_`
    
    return mensagem
  }

  const enviarWhatsApp = () => {
    if (!nome || !telefone || !endereco) {
      alert('Preencha nome, telefone e endereço.')
      return
    }
    const mensagem = gerarMensagem()
    const numeroLimpo = whatsappEstabelecimento?.replace(/\D/g, '') || ''
    const url = `https://wa.me/55${numeroLimpo}?text=${mensagem}`
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
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone *</label>
            <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endereço de entrega *</label>
            <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Forma de pagamento</label>
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option>Dinheiro</option>
              <option>Cartão de débito</option>
              <option>Cartão de crédito</option>
              <option>Pix</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={2} placeholder="Troco para R$ 50, ponto de referência..." />
          </div>
          
          {/* Preview da mensagem */}
          <div className="bg-gray-100 p-3 rounded-lg mt-3">
            <p className="text-xs text-gray-500 mb-2 font-medium">📱 Preview da mensagem:</p>
            <div className="text-xs text-gray-700 whitespace-pre-line font-mono">
              {`🛵 *NOVO PEDIDO DELIVERY* 🛵

━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${nome || '___________'}
📞 *Telefone:* ${telefone || '___________'}
📍 *Endereço:* ${endereco || '___________'}
💳 *Pagamento:* ${pagamento}

━━━━━━━━━━━━━━━━━━
📋 *ITENS DO PEDIDO*
━━━━━━━━━━━━━━━━━━

${itens.map((item, i) => `${i + 1}️⃣  *${item.quantidade}x*  ${item.nome}\n       R$ ${item.preco.toFixed(2)} cada  |  Subtotal: R$ ${(item.preco * item.quantidade).toFixed(2)}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━
💰 *TOTAL: R$ ${total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━

📱 _Pedido enviado via menu.salvador.br_
⏰ _Aguardando confirmação_`}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button onClick={enviarWhatsApp} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
              💬 Enviar via WhatsApp
            </button>
            <button onClick={onFechar} className="flex-1 border py-2 rounded-lg font-semibold hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}