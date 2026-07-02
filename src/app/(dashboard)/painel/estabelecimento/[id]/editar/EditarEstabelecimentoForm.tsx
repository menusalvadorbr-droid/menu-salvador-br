'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface EditarEstabelecimentoFormProps {
  estabelecimento: any
  podeEditar: boolean
  userId: string
}

export default function EditarEstabelecimentoForm({
  estabelecimento,
  podeEditar,
  userId,
}: EditarEstabelecimentoFormProps) {
  const supabase = createClient()
  const [nome, setNome] = useState(estabelecimento.nome || '')
  const [nomeFantasia, setNomeFantasia] = useState(estabelecimento.nome_fantasia || '')
  const [descricao, setDescricao] = useState(estabelecimento.descricao || '')
  const [endereco, setEndereco] = useState(estabelecimento.endereco || '')
  const [bairro, setBairro] = useState(estabelecimento.bairro || '')
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '')
  const [whatsapp, setWhatsapp] = useState(estabelecimento.whatsapp || '')
  const [instagram, setInstagram] = useState(estabelecimento.instagram || '')
  const [tipoCozinha, setTipoCozinha] = useState(estabelecimento.tipo_cozinha || '')
  // ⬇️ NOVO: estado para tipo_estabelecimento
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState(estabelecimento.tipo_estabelecimento || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeEditar) {
      setMessage({ type: 'error', text: 'Edição bloqueada.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        nome,
        nome_fantasia: nomeFantasia,
        descricao,
        endereco,
        bairro,
        telefone,
        whatsapp,
        instagram,
        tipo_cozinha: tipoCozinha,
        tipo_estabelecimento: tipoEstabelecimento, // ⬅️ NOVO: enviando o campo
        updated_at: new Date().toISOString(),
      })
      .eq('id', estabelecimento.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message })
    } else {
      setMessage({ type: 'success', text: '✅ Informações atualizadas com sucesso!' })
    }
    setLoading(false)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">📋 Informações do Estabelecimento</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do estabelecimento *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome fantasia</label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            disabled={!podeEditar}
            rows={4}
            className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Endereço</label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bairro *</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              disabled={!podeEditar}
              required
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
              placeholder="@usuario"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de cozinha *</label>
            <input
              type="text"
              value={tipoCozinha}
              onChange={(e) => setTipoCozinha(e.target.value)}
              disabled={!podeEditar}
              required
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
              placeholder="Ex: Baiana, Italiana, Japonesa"
            />
          </div>

          {/* ⬇️ NOVO CAMPO: tipo_estabelecimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de estabelecimento *</label>
            <select
              value={tipoEstabelecimento}
              onChange={(e) => setTipoEstabelecimento(e.target.value)}
              disabled={!podeEditar}
              required
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            >
              <option value="">Selecione o tipo</option>
              <option value="restaurante">🍽️ Restaurante</option>
              <option value="bar">🍺 Bar</option>
              <option value="lanchonete">🥪 Lanchonete</option>
              <option value="foodtruck">🚚 Food Truck</option>
              <option value="banca_acaraje">🫘 Banca de Acarajé</option>
              <option value="cafeteria">☕ Cafeteria</option>
              <option value="hamburgueria">🍔 Hamburgueria</option>
              <option value="churrascaria">🥩 Churrascaria</option>
              <option value="confeitaria">🍰 Confeitaria</option>
              <option value="pizzaria">🍕 Pizzaria</option>
            </select>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {podeEditar && (
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        )}
      </form>
    </div>
  )
}