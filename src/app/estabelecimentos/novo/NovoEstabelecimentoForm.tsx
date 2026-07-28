'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify, formatarCep, limparNumeroEndereco } from '@/lib/utils'
import { formatarCnpj, validarCnpj, limparCnpj } from '@/lib/cnpj'
import { enviarClaim, enviarContestacao } from '@/app/claim/actions'
import type { DadosCnpj } from '@/lib/brasilapi'

interface NovoEstabelecimentoFormProps {
  userId: string
  userNome: string
  cnpjInicial?: string
  /** Já garantidos pelo perfil completo (checarPerfilCompleto) — não
   * precisa perguntar de novo em nenhum dos dois fluxos abaixo. */
  perfilTelefone: string
  perfilWhatsapp: string
  bairros: { id: string; nome: string }[]
  tiposEstabelecimento: { slug: string; nome: string; icone: string | null }[]
}

// Remove acentos e normaliza caixa/espaços — usado só pra comparar o
// bairro solto que vem da Receita com o nome cadastrado na tabela
// oficial (grafias como "São João" vs "Sao Joao" não deveriam falhar).
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export default function NovoEstabelecimentoForm({
  userId,
  userNome,
  cnpjInicial = '',
  perfilTelefone,
  perfilWhatsapp,
  bairros,
  tiposEstabelecimento,
}: NovoEstabelecimentoFormProps) {
  const supabase = createClient()
  const router = useRouter()

  const [cnpj, setCnpj] = useState(cnpjInicial)
  const [consultando, setConsultando] = useState(false)
  const [erroConsulta, setErroConsulta] = useState<string | null>(null)
  const [dadosCnpj, setDadosCnpj] = useState<DadosCnpj | null>(null)
  const [estabelecimentoExistente, setEstabelecimentoExistente] = useState<{ id: string; nome: string; slug: string; temDono: boolean } | null>(null)

  const [enviandoClaim, setEnviandoClaim] = useState(false)
  const [erroClaim, setErroClaim] = useState<string | null>(null)

  const [mostrarContestacao, setMostrarContestacao] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [enviandoContestacao, setEnviandoContestacao] = useState(false)
  const [contestacaoEnviada, setContestacaoEnviada] = useState(false)
  const [erroContestacao, setErroContestacao] = useState<string | null>(null)

  const [nomeFantasia, setNomeFantasia] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState('')

  const [tipoLogradouro, setTipoLogradouro] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairroId, setBairroId] = useState('')
  const [cep, setCep] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cnpjValido = validarCnpj(cnpj)
  const cnpjBloqueado = !!dadosCnpj

  useEffect(() => {
    if (cnpjInicial && validarCnpj(cnpjInicial)) {
      buscarCnpj()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function buscarCnpj() {
    setErroConsulta(null)
    setEstabelecimentoExistente(null)
    if (!validarCnpj(cnpj)) {
      setErroConsulta('CNPJ inválido. Confira os números digitados.')
      return
    }

    setConsultando(true)
    try {
      const { data: existente } = await supabase
        .from('estabelecimentos')
        .select('id, nome_fantasia, nome, slug, owner_user_id')
        .eq('cnpj', limparCnpj(cnpj))
        .maybeSingle()

      if (existente) {
        setEstabelecimentoExistente({
          id: existente.id,
          nome: existente.nome_fantasia || existente.nome,
          slug: existente.slug,
          temDono: Boolean(existente.owner_user_id),
        })
        setConsultando(false)
        return
      }

      const res = await fetch('/api/cnpj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: limparCnpj(cnpj) }),
      })
      const dados: DadosCnpj = await res.json()

      if (!res.ok) throw new Error((dados as any).error || 'Erro ao consultar CNPJ.')

      // Só permite seguir com empresa ativa na Receita — inapta, baixada
      // ou suspensa não deveria virar estabelecimento no diretório.
      const situacaoAtiva = (dados.situacaoCadastral || '').toLowerCase().includes('ativa')
      if (!situacaoAtiva) {
        setErroConsulta(
          `Esse CNPJ está com situação "${dados.situacaoCadastral || 'desconhecida'}" na Receita Federal — só é possível cadastrar empresas ativas.`
        )
        setConsultando(false)
        return
      }

      setDadosCnpj(dados)
      setNomeFantasia(dados.nomeFantasia || '')
      setTipoLogradouro(dados.tipoLogradouro || '')
      setLogradouro(dados.logradouro || '')
      setNumero(limparNumeroEndereco(dados.numero))
      setComplemento(dados.complemento || '')
      setCep(dados.cep || '')

      if (dados.bairro) {
        const normalizado = normalizar(dados.bairro)
        const encontrado = bairros.find((b) => normalizar(b.nome) === normalizado)
        setBairroId(encontrado?.id || '')
      }
    } catch (err: any) {
      setErroConsulta(err.message || 'Erro ao consultar CNPJ.')
    } finally {
      setConsultando(false)
    }
  }

  function trocarCnpj() {
    setDadosCnpj(null)
    setEstabelecimentoExistente(null)
    setNomeFantasia('')
    setDescricao('')
    setTipoEstabelecimento('')
    setTipoLogradouro('')
    setLogradouro('')
    setNumero('')
    setComplemento('')
    setBairroId('')
    setCep('')
    setMostrarContestacao(false)
    setJustificativa('')
    setContestacaoEnviada(false)
  }

  async function confirmarReivindicacao() {
    if (!estabelecimentoExistente) return
    setErroClaim(null)
    setEnviandoClaim(true)
    try {
      await enviarClaim({ estabelecimentoId: estabelecimentoExistente.id })
    } catch (err: any) {
      if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err
      setErroClaim(err.message || 'Erro ao enviar reivindicação.')
      setEnviandoClaim(false)
    }
  }

  async function enviarContestacaoClick() {
    if (!estabelecimentoExistente) return
    setErroContestacao(null)
    setEnviandoContestacao(true)
    try {
      await enviarContestacao(estabelecimentoExistente.id, justificativa)
      setContestacaoEnviada(true)
    } catch (err: any) {
      setErroContestacao(err.message || 'Erro ao enviar contestação.')
    } finally {
      setEnviandoContestacao(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const nomeParaRegistro = dadosCnpj?.razaoSocial || ''

    if (!cnpjValido) {
      setError('Informe um CNPJ válido.')
      return
    }
    if (!dadosCnpj) {
      setError('Consulte o CNPJ antes de continuar.')
      return
    }
    if (!nomeFantasia.trim()) {
      setError('Informe o nome fantasia.')
      return
    }
    if (!tipoEstabelecimento) {
      setError('Selecione o tipo de estabelecimento.')
      return
    }

    setLoading(true)

    try {
      const { data: existenteCnpj } = await supabase
        .from('estabelecimentos')
        .select('id')
        .eq('cnpj', limparCnpj(cnpj))
        .maybeSingle()

      if (existenteCnpj) {
        throw new Error('Já existe um estabelecimento cadastrado com esse CNPJ.')
      }

      const baseSlug = slugify(nomeFantasia)
      let slugFinal = baseSlug
      let tentativa = 0

      while (tentativa < 20) {
        const { data: existente } = await supabase
          .from('estabelecimentos')
          .select('id')
          .eq('slug', slugFinal)
          .maybeSingle()

        if (!existente) break
        tentativa += 1
        slugFinal = `${baseSlug}-${tentativa + 1}`
      }

      const { data: novoEstabelecimento, error: insertError } = await supabase
        .from('estabelecimentos')
        .insert({
          nome: nomeParaRegistro,
          nome_fantasia: nomeFantasia.trim(),
          razao_social: nomeParaRegistro,
          descricao: descricao.trim() || null,
          tipo_estabelecimento: tipoEstabelecimento,
          cnpj: limparCnpj(cnpj),
          situacao_cadastral: dadosCnpj?.situacaoCadastral || null,
          atividade_economica: dadosCnpj?.atividadeEconomica || null,
          cnae_codigo: dadosCnpj?.cnaeCodigo || null,
          tipo_logradouro: tipoLogradouro || null,
          endereco: logradouro.trim() || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro_id: bairroId || null,
          cep: cep || null,
          slug: slugFinal,
          telefone: perfilTelefone || null,
          whatsapp: perfilWhatsapp || null,
          owner_user_id: userId,
          status: 'active',
          ativo: true,
          cidade: dadosCnpj?.cidade || 'Salvador',
        })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)

      router.push(`/painel/estabelecimento/${novoEstabelecimento.id}/gerenciar`)
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar estabelecimento.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatarCnpj(cnpj)}
            onChange={(e) => setCnpj(e.target.value)}
            disabled={cnpjBloqueado}
            required
            maxLength={18}
            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 ${
              cnpj.length > 0 && !cnpjValido ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="00.000.000/0000-00"
          />
          {!cnpjBloqueado && (
            <button
              type="button"
              onClick={buscarCnpj}
              disabled={!cnpjValido || consultando}
              className="shrink-0 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition disabled:opacity-40"
            >
              {consultando ? 'Buscando...' : 'Buscar'}
            </button>
          )}
          {cnpjBloqueado && (
            <button
              type="button"
              onClick={trocarCnpj}
              className="shrink-0 text-sm text-gray-500 hover:underline px-2"
            >
              Trocar
            </button>
          )}
        </div>
        {cnpj.length > 0 && !cnpjValido && <p className="text-xs text-red-500 mt-1">CNPJ inválido</p>}
        {erroConsulta && (
          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
            {erroConsulta}
            <button
              type="button"
              onClick={buscarCnpj}
              disabled={consultando}
              className="block mt-1 text-orange-700 font-medium hover:underline disabled:opacity-50"
            >
              {consultando ? 'Tentando...' : 'Tentar novamente'}
            </button>
          </div>
        )}

        {estabelecimentoExistente && !estabelecimentoExistente.temDono && (
          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900">
              <strong>{estabelecimentoExistente.nome}</strong> já está no menu.salvador, cadastrado pela plataforma
              e ainda sem dono. Confirma que é o seu estabelecimento?
            </p>

            {erroClaim && <p className="mt-2 text-sm text-red-600">{erroClaim}</p>}

            <button
              type="button"
              onClick={confirmarReivindicacao}
              disabled={enviandoClaim}
              className="mt-3 w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
            >
              {enviandoClaim ? 'Enviando...' : 'Confirmar e enviar para aprovação'}
            </button>
          </div>
        )}

        {estabelecimentoExistente && estabelecimentoExistente.temDono && (
          <div className="mt-2 bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm text-neutral-600">
            <p>
              Esse CNPJ já está vinculado a <strong>{estabelecimentoExistente.nome}</strong>, que já tem um
              responsável cadastrado.
            </p>

            {contestacaoEnviada ? (
              <p className="mt-2 text-green-700">
                Contestação enviada. Nossa equipe vai analisar e entrar em contato se precisar de mais informação.
              </p>
            ) : mostrarContestacao ? (
              <div className="mt-3">
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Descreva por que você acredita que esse estabelecimento deveria estar vinculado a você
                </label>
                <textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={3}
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Explique a situação..."
                />
                {erroContestacao && <p className="mt-1 text-sm text-red-600">{erroContestacao}</p>}
                {justificativa.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={enviarContestacaoClick}
                    disabled={enviandoContestacao}
                    className="mt-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:opacity-50"
                  >
                    {enviandoContestacao ? 'Enviando...' : 'Enviar'}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrarContestacao(true)}
                className="mt-2 text-sm text-orange-700 hover:underline"
              >
                Acha que isso está errado?
              </button>
            )}
          </div>
        )}
      </div>

      {!estabelecimentoExistente && (
      <>

      {dadosCnpj && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Dados da Receita</p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Razão social</label>
          <input
            type="text"
            value={dadosCnpj.razaoSocial}
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500"
          />
          {dadosCnpj.situacaoCadastral && (
            <p
              className={`text-xs mt-1 ${
                dadosCnpj.situacaoCadastral.toLowerCase().includes('ativa')
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
            >
              Situação cadastral: {dadosCnpj.situacaoCadastral}
            </p>
          )}
          {dadosCnpj.atividadeEconomica && (
            <p className="text-xs text-gray-400 mt-0.5">
              Atividade econômica: {dadosCnpj.atividadeEconomica}
            </p>
          )}
        </div>
      )}

      {dadosCnpj && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Identidade pública</p>

          <label className="block text-sm font-medium text-gray-700 mb-1">Nome fantasia *</label>
          {nomeFantasia.trim() && (
            <p className="mb-1 text-xs text-gray-400 truncate">
              Endereço da página pública: <span className="text-orange-600 font-medium">/{slugify(nomeFantasia)}</span>
              <span className="text-gray-300"> (pode ganhar um número no final se já existir)</span>
            </p>
          )}
          <input
            type="text"
            required
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Como o público vai ver o nome"
          />

          <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Tipo de estabelecimento *</label>
          <select
            required
            value={tipoEstabelecimento}
            onChange={(e) => setTipoEstabelecimento(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Selecione o tipo</option>
            {tiposEstabelecimento.map((t) => (
              <option key={t.slug} value={t.slug}>{t.icone ? `${t.icone} ` : ''}{t.nome}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Conte brevemente sobre o estabelecimento (opcional)"
          />
        </div>
      )}

      {dadosCnpj && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Endereço</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de logradouro</label>
              <input
                type="text"
                value={tipoLogradouro}
                onChange={(e) => setTipoLogradouro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Rua, Avenida..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Sala, andar... (opcional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <select
                value={bairroId}
                onChange={(e) => setBairroId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Selecione o bairro</option>
                {bairros.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={formatarCep(cep)}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Telefone/WhatsApp de contato: os que já estão no seu perfil.
          </p>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !dadosCnpj}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar e continuar'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Culinária e outras informações você completa na próxima tela.
      </p>

      </>
      )}
    </form>
  )
}
