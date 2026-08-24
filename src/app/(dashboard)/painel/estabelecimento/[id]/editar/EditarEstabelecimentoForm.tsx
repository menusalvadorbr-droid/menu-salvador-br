'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarCep } from '@/lib/utils'
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

  // Painel "Conta" abre em modo leitura por padrão — mesmo padrão de
  // /painel/perfil (PerfilForm.tsx).
  const [editando, setEditando] = useState(false)

  const [nomeFantasia, setNomeFantasia] = useState(estabelecimento.nome_fantasia || '')
  const [descricao, setDescricao] = useState(estabelecimento.descricao || '')
  const [tipoLogradouro, setTipoLogradouro] = useState(estabelecimento.tipo_logradouro || '')
  const [logradouro, setLogradouro] = useState(estabelecimento.endereco || '')
  const [numero, setNumero] = useState(estabelecimento.numero || '')
  const [complemento, setComplemento] = useState(estabelecimento.complemento || '')
  const [bairroId, setBairroId] = useState(estabelecimento.bairro_id || '')
  const [cep, setCep] = useState(estabelecimento.cep || '')
  const [bairros, setBairros] = useState<{ id: string; nome: string; cidade_id: string | null }[]>([])
  const [cidades, setCidades] = useState<{ id: string; nome: string }[]>([])
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '')
  const [whatsapp, setWhatsapp] = useState(estabelecimento.whatsapp || '')
  const [instagram, setInstagram] = useState(estabelecimento.instagram || '')
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState(estabelecimento.tipo_estabelecimento || '')
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<{ slug: string; nome: string; icone: string | null }[]>([])
  const [tiposCozinha, setTiposCozinha] = useState<{ id: number; nome: string; icone: string | null }[]>([])
  const [culinariasSelecionadas, setCulinariasSelecionadas] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    supabase
      .from('bairros')
      .select('id, nome, cidade_id')
      .order('nome')
      .then(({ data }) => setBairros(data || []))

    supabase
      .from('cidades')
      .select('id, nome')
      .order('nome')
      .then(({ data }) => setCidades(data || []))

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

  function cancelar() {
    setNomeFantasia(estabelecimento.nome_fantasia || '')
    setDescricao(estabelecimento.descricao || '')
    setTipoLogradouro(estabelecimento.tipo_logradouro || '')
    setLogradouro(estabelecimento.endereco || '')
    setNumero(estabelecimento.numero || '')
    setComplemento(estabelecimento.complemento || '')
    setBairroId(estabelecimento.bairro_id || '')
    setCep(estabelecimento.cep || '')
    setTelefone(estabelecimento.telefone || '')
    setWhatsapp(estabelecimento.whatsapp || '')
    setInstagram(estabelecimento.instagram || '')
    setTipoEstabelecimento(estabelecimento.tipo_estabelecimento || '')
    setMessage(null)
    setEditando(false)
  }

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
        nome_fantasia: nomeFantasia,
        descricao,
        tipo_logradouro: tipoLogradouro || null,
        endereco: logradouro || null,
        numero: numero || null,
        complemento: complemento || null,
        bairro_id: bairroId || null,
        bairro: nomeBairroEscolhido, // mantido em sincronia só pra exibição — a fonte de verdade é bairro_id
        cep: cep || null,
        telefone,
        whatsapp,
        instagram,
        tipo_estabelecimento: tipoEstabelecimento,
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
    setEditando(false)
  }

  const nomeBairroAtual = bairros.find((b) => b.id === bairroId)?.nome || estabelecimento.bairro || null

  // Agrupado por cidade (<optgroup>) — várias contas ainda não têm
  // cidade_id preenchido no próprio estabelecimento (dado legado), então
  // agrupar a lista organiza sem arriscar esconder o bairro certo.
  const bairrosPorCidade = cidades
    .map((c) => ({ cidade: c, bairros: bairros.filter((b) => b.cidade_id === c.id) }))
    .filter((g) => g.bairros.length > 0)
  const bairrosSemCidade = bairros.filter((b) => !b.cidade_id)
  const enderecoCompleto = [
    [[tipoLogradouro, logradouro].filter(Boolean).join(' '), numero && `nº ${numero}`, complemento]
      .filter(Boolean)
      .join(', '),
    nomeBairroAtual,
    cep && `CEP ${formatarCep(cep)}`,
  ]
    .filter(Boolean)
    .join(' — ')

  const tipoAtual = tiposEstabelecimento.find((t) => t.slug === tipoEstabelecimento)
  const nomesCulinaria = tiposCozinha
    .filter((t) => culinariasSelecionadas.includes(t.id))
    .map((t) => `${t.icone ? t.icone + ' ' : ''}${t.nome}`)
    .join(', ')

  // ------------------------------------------------------------------
  // Modo leitura — dados como texto, botão Editar
  // ------------------------------------------------------------------
  if (!editando) {
    return (
      <div>
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dados do estabelecimento</p>
          {podeEditar && (
            <button
              onClick={() => setEditando(true)}
              className="shrink-0 rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Editar
            </button>
          )}
        </div>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs text-gray-400">Razão social</dt>
            <dd className="text-gray-900">{estabelecimento.razao_social || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Nome fantasia</dt>
            <dd className="text-gray-900">{nomeFantasia || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Descrição</dt>
            <dd className="text-gray-900">{descricao || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Endereço</dt>
            <dd className="text-gray-900">{enderecoCompleto || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Contato</dt>
            <dd className="text-gray-900">
              {[telefone, whatsapp && `WhatsApp ${whatsapp}`, instagram && `@${instagram.replace(/^@/, '')}`]
                .filter(Boolean)
                .join(' · ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Tipo de estabelecimento</dt>
            <dd className="text-gray-900">
              {tipoAtual ? `${tipoAtual.icone ? tipoAtual.icone + ' ' : ''}${tipoAtual.nome}` : tipoEstabelecimento || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Culinária</dt>
            <dd className="text-gray-900">{nomesCulinaria || '—'}</dd>
          </div>
        </dl>
      </div>
    )
  }

  // ------------------------------------------------------------------
  // Modo edição
  // ------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Razão social</label>
        <input
          type="text"
          value={estabelecimento.razao_social || ''}
          disabled
          className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-500"
        />
        <p className="mt-1 text-xs text-gray-400">
          Vem do CNPJ e não é editável por aqui — nasce igual à razão social oficial, não é um apelido.
        </p>
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

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de logradouro</label>
            <input
              type="text"
              value={tipoLogradouro}
              onChange={(e) => setTipoLogradouro(e.target.value)}
              disabled={!podeEditar}
              placeholder="Rua, Avenida..."
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logradouro</label>
            <input
              type="text"
              value={logradouro}
              onChange={(e) => setLogradouro(e.target.value)}
              disabled={!podeEditar}
              placeholder="Nome da rua"
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              disabled={!podeEditar}
              placeholder="Sala, andar... (opcional)"
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
              {bairrosPorCidade.map((g) => (
                <optgroup key={g.cidade.id} label={g.cidade.nome}>
                  {g.bairros.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </optgroup>
              ))}
              {bairrosSemCidade.length > 0 && (
                <optgroup label="Sem cidade">
                  {bairrosSemCidade.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <input
              type="text"
              value={formatarCep(cep)}
              onChange={(e) => setCep(e.target.value)}
              disabled={!podeEditar}
              className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Contato</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="px-6 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      )}
    </form>
  )
}
