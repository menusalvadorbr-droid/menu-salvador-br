'use client'

import { useState } from 'react'
import { vincularBairroExistente, criarBairroEVincular } from './actions'

export interface EstabelecimentoPendente {
  id: string
  nome_fantasia: string | null
  nome: string
  bairro_informado: string | null
  cidade_id: string
  cidadeNome: string
}

interface Props {
  pendentesIniciais: EstabelecimentoPendente[]
  bairros: { id: string; nome: string; cidade_id: string | null }[]
}

/**
 * Fila de curadoria — estabelecimentos ativos sem bairro_id (Opção B do
 * cadastro por CNPJ: entra fora da hierarquia completa em vez de
 * bloquear ou inventar bairro sozinho). Cada linha some da lista assim
 * que ganha um bairro, sem precisar recarregar a página inteira.
 */
export default function PendenciasBairro({ pendentesIniciais, bairros }: Props) {
  const [pendentes, setPendentes] = useState(pendentesIniciais)
  const [processandoId, setProcessandoId] = useState<string | null>(null)
  const [bairroEscolhido, setBairroEscolhido] = useState<Record<string, string>>({})
  const [nomeNovoBairro, setNomeNovoBairro] = useState<Record<string, string>>({})
  const [erro, setErro] = useState<Record<string, string>>({})

  function removerDaLista(id: string) {
    setPendentes((prev) => prev.filter((p) => p.id !== id))
  }

  async function vincular(item: EstabelecimentoPendente) {
    const bairroId = bairroEscolhido[item.id]
    if (!bairroId) return
    setProcessandoId(item.id)
    setErro((prev) => ({ ...prev, [item.id]: '' }))
    try {
      await vincularBairroExistente(item.id, bairroId)
      removerDaLista(item.id)
    } catch (err) {
      setErro((prev) => ({ ...prev, [item.id]: err instanceof Error ? err.message : 'Erro ao vincular' }))
    } finally {
      setProcessandoId(null)
    }
  }

  async function criarNovo(item: EstabelecimentoPendente) {
    const nome = (nomeNovoBairro[item.id] || '').trim()
    if (!nome) return
    setProcessandoId(item.id)
    setErro((prev) => ({ ...prev, [item.id]: '' }))
    try {
      await criarBairroEVincular(item.id, item.cidade_id, nome)
      removerDaLista(item.id)
    } catch (err) {
      setErro((prev) => ({ ...prev, [item.id]: err instanceof Error ? err.message : 'Erro ao criar bairro' }))
    } finally {
      setProcessandoId(null)
    }
  }

  if (pendentes.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-sm text-neutral-400 shadow-sm">
        Nenhum estabelecimento pendente de bairro no momento.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {pendentes.map((item) => {
        const bairrosDaCidade = bairros.filter((b) => b.cidade_id === item.cidade_id)
        const processando = processandoId === item.id
        return (
          <div key={item.id} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-neutral-900">{item.nome_fantasia || item.nome}</p>
              <span className="text-xs text-neutral-400">{item.cidadeNome}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Bairro informado pela Receita:{' '}
              <span className="font-medium text-neutral-700">{item.bairro_informado || '— não informado —'}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Vincular a um bairro existente
                <select
                  value={bairroEscolhido[item.id] || ''}
                  onChange={(e) => setBairroEscolhido((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
                >
                  <option value="">Selecione</option>
                  {bairrosDaCidade.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => vincular(item)}
                disabled={processando || !bairroEscolhido[item.id]}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Vincular
              </button>

              <span className="mx-1 text-xs text-neutral-300">ou</span>

              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Cadastrar bairro novo em {item.cidadeNome}
                <input
                  value={nomeNovoBairro[item.id] ?? item.bairro_informado ?? ''}
                  onChange={(e) => setNomeNovoBairro((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
                  placeholder="Nome do bairro"
                />
              </label>
              <button
                onClick={() => criarNovo(item)}
                disabled={processando || !(nomeNovoBairro[item.id] ?? item.bairro_informado ?? '').trim()}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-50"
              >
                Criar e vincular
              </button>
            </div>

            {erro[item.id] && <p className="mt-2 text-xs text-red-600">{erro[item.id]}</p>}
          </div>
        )
      })}
    </div>
  )
}
