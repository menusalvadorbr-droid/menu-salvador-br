'use client'

import { useCallback, useEffect, useState } from 'react'
import { listarFichasTecnicas, removerFichaTecnica } from '../fichaTecnicaRepository'
import type { FichaTecnica } from '../types'
import FichaTecnicaForm from './FichaTecnicaForm'
import { formatarReais } from '@/lib/moeda'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'

export default function FichaTecnicaManager({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [carregando, setCarregando] = useState(true)
  const [fichaAberta, setFichaAberta] = useState<string | null | 'nova'>(null)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState<FichaTecnica | null>(null)
  const [removendo, setRemovendo] = useState(false)

  const carregar = useCallback(async () => {
    try {
      setFichas(await listarFichasTecnicas(estabelecimentoId))
    } finally {
      setCarregando(false)
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function remover(id: string) {
    setRemovendo(true)
    try {
      await removerFichaTecnica(id)
      await carregar()
      setConfirmandoRemocao(null)
    } catch (err) {
      alert(`Não foi possível remover: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    } finally {
      setRemovendo(false)
    }
  }

  if (fichaAberta) {
    return (
      <FichaTecnicaForm
        estabelecimentoId={estabelecimentoId}
        fichaTecnicaId={fichaAberta === 'nova' ? null : fichaAberta}
        onVoltar={() => {
          setFichaAberta(null)
          carregar()
        }}
      />
    )
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando fichas técnicas...</div>
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{fichas.length} ficha(s) técnica(s) cadastrada(s)</p>
        <button
          onClick={() => setFichaAberta('nova')}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + Nova ficha técnica
        </button>
      </div>

      {fichas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
          Nenhuma ficha técnica cadastrada ainda. Cadastre insumos primeiro, depois monte a ficha de cada prato.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fichas.map((ficha) => (
            <button
              key={ficha.id}
              onClick={() => setFichaAberta(ficha.id)}
              className="rounded-2xl border border-neutral-100 bg-white p-4 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-neutral-900">{ficha.nome}</p>
                {ficha.status === 'inativa' && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">inativa</span>
                )}
              </div>
              {ficha.categoria_venda && <p className="mt-0.5 text-xs text-neutral-400">{ficha.categoria_venda}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>Rende {ficha.rendimento_qtd} {ficha.rendimento_unidade}</span>
                {ficha.preco_venda != null && <span>R$ {formatarReais(ficha.preco_venda)}</span>}
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmandoRemocao(ficha)
                }}
                className="mt-3 inline-block text-xs text-red-500 hover:underline"
              >
                Remover
              </span>
            </button>
          ))}
        </div>
      )}

      {confirmandoRemocao && (
        <ConfirmarAcaoModal
          tema="claro"
          tom="perigo"
          titulo="Remover ficha técnica"
          descricao={`Remover a ficha técnica "${confirmandoRemocao.nome}"? Isso também remove fichas que a usem como sub-ficha só se elas não tiverem itens vinculados a ela.`}
          confirmarLabel="Remover"
          enviando={removendo}
          onCancelar={() => setConfirmandoRemocao(null)}
          onConfirmar={() => remover(confirmandoRemocao.id)}
        />
      )}
    </div>
  )
}
