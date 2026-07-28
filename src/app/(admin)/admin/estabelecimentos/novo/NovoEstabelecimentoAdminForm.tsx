'use client'

import { useState } from 'react'
import { formatarCnpj, validarCnpj, limparCnpj } from '@/lib/cnpj'
import type { DadosCnpjCompleto } from '@/lib/brasilapi'
import { criarEstabelecimentoAdmin } from './actions'

export default function NovoEstabelecimentoAdminForm() {
  const [cnpj, setCnpj] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [erroConsulta, setErroConsulta] = useState<string | null>(null)
  const [dados, setDados] = useState<DadosCnpjCompleto | null>(null)

  const [nomeFantasia, setNomeFantasia] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cnpjValido = validarCnpj(cnpj)

  async function buscarCnpj() {
    setErroConsulta(null)
    if (!cnpjValido) {
      setErroConsulta('CNPJ inválido.')
      return
    }
    setConsultando(true)
    try {
      const res = await fetch('/api/admin/cnpj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: limparCnpj(cnpj) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao consultar CNPJ.')
      setDados(json)
      setNomeFantasia(json.nomeFantasia || '')
      setTelefone(json.telefone || '')
    } catch (err: any) {
      setErroConsulta(err.message || 'Erro ao consultar CNPJ.')
    } finally {
      setConsultando(false)
    }
  }

  function trocarCnpj() {
    setDados(null)
    setNomeFantasia('')
    setTelefone('')
    setWhatsapp('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!dados) {
      setError('Consulte o CNPJ antes de continuar.')
      return
    }
    if (!nomeFantasia.trim()) {
      setError('Informe o nome fantasia.')
      return
    }

    setLoading(true)
    try {
      await criarEstabelecimentoAdmin({
        cnpj: dados.cnpj,
        razaoSocial: dados.razaoSocial,
        nomeFantasia,
        situacaoCadastral: dados.situacaoCadastral || null,
        atividadeEconomica: dados.atividadeEconomica,
        cnaeCodigo: dados.cnaeCodigo,
        tipoLogradouro: dados.tipoLogradouro,
        endereco: dados.logradouro,
        numero: dados.numero,
        cep: dados.cep,
        cidade: dados.cidade,
        dataAbertura: dados.dataAbertura,
        opcaoPeloSimples: dados.opcaoPeloSimples,
        dataOpcaoPeloSimples: dados.dataOpcaoPeloSimples,
        socios: dados.socios,
        telefone,
        whatsapp,
      })
    } catch (err: any) {
      if (err?.digest?.startsWith?.('NEXT_REDIRECT')) throw err
      setError(err.message || 'Erro ao cadastrar estabelecimento.')
      setLoading(false)
    }
  }

  const situacaoAtiva = dados?.situacaoCadastral?.toLowerCase().includes('ativa')

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">CNPJ *</label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={formatarCnpj(cnpj)}
            onChange={(e) => setCnpj(e.target.value)}
            disabled={!!dados}
            maxLength={18}
            className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-neutral-100 disabled:text-neutral-500 ${
              cnpj.length > 0 && !cnpjValido ? 'border-red-400' : 'border-neutral-300'
            }`}
            placeholder="00.000.000/0000-00"
          />
          {!dados ? (
            <button
              type="button"
              onClick={buscarCnpj}
              disabled={!cnpjValido || consultando}
              className="shrink-0 bg-neutral-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-900 transition disabled:opacity-40"
            >
              {consultando ? 'Buscando...' : 'Buscar'}
            </button>
          ) : (
            <button type="button" onClick={trocarCnpj} className="shrink-0 text-sm text-neutral-500 hover:underline px-2">
              Trocar
            </button>
          )}
        </div>
        {erroConsulta && (
          <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{erroConsulta}</p>
        )}
      </div>

      {dados && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3 text-sm">
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide">Razão social</p>
            <p className="font-medium text-neutral-800">{dados.razaoSocial}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide">Situação cadastral</p>
              <p className={situacaoAtiva ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                {dados.situacaoCadastral || '—'}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide">Simples Nacional</p>
              <p className="text-neutral-700">
                {dados.opcaoPeloSimples === null
                  ? '—'
                  : dados.opcaoPeloSimples
                  ? `Optante${dados.dataOpcaoPeloSimples ? ` desde ${dados.dataOpcaoPeloSimples}` : ''}`
                  : 'Não optante'}
              </p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide">Atividade econômica</p>
              <p className="text-neutral-700">{dados.atividadeEconomica || '—'}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide">Data de abertura</p>
              <p className="text-neutral-700">{dados.dataAbertura || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-neutral-400 text-xs uppercase tracking-wide">Endereço</p>
              <p className="text-neutral-700">
                {[dados.tipoLogradouro, dados.endereco].filter(Boolean).join(' ')}
                {dados.cep ? ` — CEP ${dados.cep}` : ''}
              </p>
            </div>
          </div>

          {dados.socios.length > 0 && (
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Quadro de sócios</p>
              <ul className="space-y-1">
                {dados.socios.map((socio, i) => (
                  <li key={i} className="text-neutral-700">
                    <span className="font-medium">{socio.nome}</span>
                    {socio.qualificacao && <span className="text-neutral-400"> — {socio.qualificacao}</span>}
                    {socio.faixaEtaria && <span className="text-neutral-400"> · {socio.faixaEtaria}</span>}
                    {socio.cpfMascarado && <span className="text-neutral-400"> · CPF {socio.cpfMascarado}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {dados && (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome fantasia (exibido publicamente) *</label>
            <input
              type="text"
              required
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !dados}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
      >
        {loading ? 'Cadastrando...' : 'Adicionar ao diretório'}
      </button>
    </form>
  )
}
