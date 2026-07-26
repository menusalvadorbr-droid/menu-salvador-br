'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SeletorCulinariaTags from './components/SeletorCulinariaTags'

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
  const [bairroId, setBairroId] = useState(estabelecimento.bairro_id || '')
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([])
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '')
  const [whatsapp, setWhatsapp] = useState(estabelecimento.whatsapp || '')
  const [instagram, setInstagram] = useState(estabelecimento.instagram || '')
  // ⬇️ NOVO: estado para tipo_estabelecimento
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState(estabelecimento.tipo_estabelecimento || '')
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<{ slug: string; nome: string; icone: string | null }[]>([])
  const [tiposCozinha, setTiposCozinha] = useState<{ id: number; nome: string; icone: string | null }[]>([])
  const [culinariasSelecionadas, setCulinariasSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    supabase
      .from('bairros')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => setBairros(data || []))

    // Lista gerenciável em /admin/tipos — antes era fixa no código.
    supabase
      .from('tipos_estabelecimento')
      .select('slug, nome, icone')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data }) => setTiposEstabelecimento(data || []))

    supabase
      .from('tipos_cozinha')
      .select('id, nome, icone')
      .eq('ativo', true)
      .order('ordem')
      .then(({ data }) => setTiposCozinha(data || []))

    supabase
      .from('estabelecimento_tipos_cozinha')
      .select('tipo_cozinha_id')
      .eq('estabelecimento_id', estabelecimento.id)
      .then(({ data }) => setCulinariasSelecionadas((data || []).map((c) => c.tipo_cozinha_id)))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeEditar) {
      setMessage({ type: 'error', text: 'Edição bloqueada.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const nomeBairroEscolhido = bairros.find((b) => b.id === bairroId)?.nome || null

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        nome,
        nome_fantasia: nomeFantasia,
        descricao,
        endereco,
        bairro_id: bairroId || null,
        bairro: nomeBairroEscolhido, // mantido em sincronia só pra exibição — a fonte de verdade é bairro_id
        telefone,
        whatsapp,
        instagram,
        tipo_estabelecimento: tipoEstabelecimento, // ⬅️ NOVO: enviando o campo
        updated_at: new Date().toISOString(),
      })
      .eq('id', estabelecimento.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message })
      setLoading(false)
      return
    }

    // Grava as culinárias junto — antes isso salvava sozinho a cada
    // clique, sem checar erro nenhum (se a RLS bloqueasse, parecia
    // salvo e voltava ao atualizar a página, sem aviso nenhum).
    const { error: erroDeleteCulinaria } = await supabase
      .from('estabelecimento_tipos_cozinha')
      .delete()
      .eq('estabelecimento_id', estabelecimento.id)

    if (erroDeleteCulinaria) {
      setMessage({ type: 'error', text: 'Informações salvas, mas houve erro ao salvar a culinária: ' + erroDeleteCulinaria.message })
      setLoading(false)
      return
    }

    if (culinariasSelecionadas.length > 0) {
      const { error: erroInsertCulinaria } = await supabase.from('estabelecimento_tipos_cozinha').insert(
        culinariasSelecionadas.map((id) => ({ estabelecimento_id: estabelecimento.id, tipo_cozinha_id: id }))
      )
      if (erroInsertCulinaria) {
        setMessage({ type: 'error', text: 'Informações salvas, mas houve erro ao salvar a culinária: ' + erroInsertCulinaria.message })
        setLoading(false)
        return
      }
    }

    setMessage({ type: 'success', text: '✅ Informações atualizadas com sucesso!' })
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
            <select
              value={bairroId}
              onChange={(e) => setBairroId(e.target.value)}
              disabled={!podeEditar}
              required
              className="w-full border rounded-lg px-4 py-2 bg-white text-gray-900 disabled:bg-gray-100"
            >
              <option value="">Selecione um bairro...</option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Não achou seu bairro na lista? Peça pro admin da plataforma cadastrar.
            </p>
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
            {tiposEstabelecimento.map((t) => (
              <option key={t.slug} value={t.slug}>{t.icone ? `${t.icone} ` : ''}{t.nome}</option>
            ))}
            {/* Se o estabelecimento já usa um tipo que não está (mais) na
                lista ativa, mantém ele selecionável pra não sumir do
                formulário sem querer. */}
            {tipoEstabelecimento && !tiposEstabelecimento.some((t) => t.slug === tipoEstabelecimento) && (
              <option value={tipoEstabelecimento}>{tipoEstabelecimento} (inativo)</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Culinária (até 3)</label>
          <SeletorCulinariaTags
            todos={tiposCozinha}
            selecionados={culinariasSelecionadas}
            onChange={setCulinariasSelecionadas}
            disabled={!podeEditar}
          />
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