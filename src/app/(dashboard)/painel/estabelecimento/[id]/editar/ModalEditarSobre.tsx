'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarCep, limparCep } from '@/lib/utils'
import { montarEnderecoCompleto, resolverLinksMapa } from '@/lib/enderecoEstabelecimento'
import ModalPerfil from './ModalPerfil'

/** Endereço — mesmos campos/consulta de bairros+cidades de
 * `EditarEstabelecimentoForm.tsx`, isolados num modal próprio. */
export default function ModalEditarSobre({
  estabelecimento,
  onFechar,
  onSalvo,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estabelecimento: any
  onFechar: () => void
  onSalvo: () => void
}) {
  const [tipoLogradouro, setTipoLogradouro] = useState(estabelecimento.tipo_logradouro || '')
  const [logradouro, setLogradouro] = useState(estabelecimento.endereco || '')
  const [numero, setNumero] = useState(estabelecimento.numero || '')
  const [complemento, setComplemento] = useState(estabelecimento.complemento || '')
  const [bairroId, setBairroId] = useState(estabelecimento.bairro_id || '')
  const [cep, setCep] = useState(estabelecimento.cep || '')
  const [bairros, setBairros] = useState<{ id: string; nome: string; cidade_id: string | null }[]>([])
  const [cidades, setCidades] = useState<{ id: string; nome: string }[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('bairros').select('id, nome, cidade_id').order('nome').then(({ data }) => setBairros(data || []))
    supabase.from('cidades').select('id, nome').order('nome').then(({ data }) => setCidades(data || []))
  }, [])

  async function handleSalvar() {
    setSalvando(true)
    setErro(null)
    const supabase = createClient()
    const nomeBairroEscolhido = bairros.find((b) => b.id === bairroId)?.nome || null

    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        tipo_logradouro: tipoLogradouro || null,
        endereco: logradouro || null,
        numero: numero || null,
        complemento: complemento || null,
        bairro_id: bairroId || null,
        bairro: nomeBairroEscolhido,
        cep: limparCep(cep) || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', estabelecimento.id)

    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onSalvo()
  }

  const bairrosPorCidade = cidades
    .map((c) => ({ cidade: c, bairros: bairros.filter((b) => b.cidade_id === c.id) }))
    .filter((g) => g.bairros.length > 0)
  const bairrosSemCidade = bairros.filter((b) => !b.cidade_id)

  const bairroSelecionado = bairros.find((b) => b.id === bairroId) || null
  const nomeCidadeSelecionada = cidades.find((c) => c.id === bairroSelecionado?.cidade_id)?.nome || ''
  const enderecoCompleto = montarEnderecoCompleto(
    { endereco: logradouro, tipo_logradouro: tipoLogradouro, numero },
    bairroSelecionado?.nome || null,
    nomeCidadeSelecionada
  )
  const { linkAbrirMapa } = resolverLinksMapa(
    {
      link_google_maps: estabelecimento.link_google_maps ?? null,
      latitude: estabelecimento.latitude ?? null,
      longitude: estabelecimento.longitude ?? null,
    },
    enderecoCompleto
  )

  return (
    <ModalPerfil titulo="Editar endereço" onFechar={onFechar}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Tipo de logradouro</label>
            <input value={tipoLogradouro} onChange={(e) => setTipoLogradouro(e.target.value)} placeholder="Rua, Avenida..." className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Logradouro</label>
            <input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Número</label>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Complemento</label>
            <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Sala, andar... (opcional)" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Bairro</label>
            <select value={bairroId} onChange={(e) => setBairroId(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm">
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
            <label className="mb-1 block text-xs font-medium text-neutral-600">CEP</label>
            <input value={formatarCep(cep)} onChange={(e) => setCep(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
          </div>
        </div>

        {logradouro.trim() && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-500">Endereço completo</p>
            <p className="text-sm text-neutral-700">{enderecoCompleto}</p>
            <a
              href={linkAbrirMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-orange-600 hover:underline"
            >
              Ver no Google Maps →
            </a>
          </div>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="self-start rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando…' : 'Salvar endereço'}
        </button>
      </div>
    </ModalPerfil>
  )
}
