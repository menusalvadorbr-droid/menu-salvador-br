'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import { listarOfertas, removerOferta, alternarAtivoOferta } from '../ofertasRepository'
import OfertaForm from './OfertaForm'
import type { CardapioV2Cardapio, CardapioV2Oferta } from '../types'
import { atualizarRecursosOpcionais } from '../cardapioRepository'
import { formatarReais } from '@/lib/moeda'

/**
 * Lista de combos do estabelecimento — atrás do toggle `ofertas_ativado`
 * (recurso opcional, mesmo padrão de alérgenos/tags: desligado por
 * padrão, o dono ativa quando quiser usar combo/Happy Hour).
 */
export default function OfertasManager({
  estabelecimentoId,
  cardapio,
  onAtualizado,
}: {
  estabelecimentoId: string
  cardapio: CardapioV2Cardapio
  onAtualizado: (cardapio: CardapioV2Cardapio) => void
}) {
  const [ofertas, setOfertas] = useState<CardapioV2Oferta[]>([])
  // Só começa "carregando" se já há algo pra carregar — evita um
  // setState síncrono dentro do efeito abaixo pro caso contrário (recurso
  // desligado, nada a buscar).
  const [carregando, setCarregando] = useState(cardapio.ofertas_ativado)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<CardapioV2Oferta | null>(null)
  const [excluindo, setExcluindo] = useState<CardapioV2Oferta | null>(null)
  const [salvandoToggle, setSalvandoToggle] = useState(false)

  async function recarregar() {
    setOfertas(await listarOfertas(estabelecimentoId))
  }

  useEffect(() => {
    if (!cardapio.ofertas_ativado) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId, cardapio.ofertas_ativado])

  async function alternarAtivado() {
    const novoValor = !cardapio.ofertas_ativado
    setSalvandoToggle(true)
    try {
      await atualizarRecursosOpcionais(cardapio.id, { ofertas_ativado: novoValor })
      onAtualizado({ ...cardapio, ofertas_ativado: novoValor })
    } finally {
      setSalvandoToggle(false)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    await removerOferta(excluindo.id)
    setExcluindo(null)
    await recarregar()
  }

  if (!cardapio.ofertas_ativado) {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <input type="checkbox" checked={false} disabled={salvandoToggle} onChange={alternarAtivado} className="mt-0.5 h-4 w-4" />
        <div>
          <p className="text-sm font-medium text-neutral-800">Combos</p>
          <p className="text-xs text-neutral-500">
            Ative pra criar combos e ofertas com Happy Hour (dias/horário) — desligado por padrão.
          </p>
        </div>
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500">
        <input type="checkbox" checked disabled={salvandoToggle} onChange={alternarAtivado} className="h-3.5 w-3.5" />
        Combos ativado — desmarque pra ocultar da página pública sem apagar nada
      </label>

      {carregando ? (
        <p className="text-xs text-neutral-400">Carregando…</p>
      ) : (
        <>
          <button
            onClick={() => { setEditando(null); setFormAberto(true) }}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" /> Novo combo
          </button>

          {ofertas.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum combo cadastrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {ofertas.map((oferta) => (
                <div key={oferta.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {oferta.nome} {!oferta.ativo && <span className="text-xs font-normal text-neutral-400">(inativo)</span>}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {oferta.preco_de && <span className="line-through">R$ {formatarReais(oferta.preco_de)}</span>}{' '}
                      R$ {formatarReais(oferta.preco_por)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      title={oferta.ativo ? 'Pausar' : 'Ativar'}
                      onClick={() => alternarAtivoOferta(oferta.id, !oferta.ativo).then(recarregar)}
                      className="px-1.5 text-xs font-medium text-neutral-500 underline hover:text-neutral-700"
                    >
                      {oferta.ativo ? 'pausar' : 'ativar'}
                    </button>
                    <button
                      onClick={() => { setEditando(oferta); setFormAberto(true) }}
                      className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExcluindo(oferta)}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {formAberto && (
        <OfertaForm
          estabelecimentoId={estabelecimentoId}
          ofertaExistente={editando}
          onClose={() => setFormAberto(false)}
          onSalvo={() => { setFormAberto(false); recarregar() }}
        />
      )}

      {excluindo && (
        <ConfirmarAcaoModal
          titulo="Excluir combo?"
          descricao={`"${excluindo.nome}" será removido — essa ação não pode ser desfeita.`}
          tom="perigo"
          confirmarLabel="Excluir"
          onCancelar={() => setExcluindo(null)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </div>
  )
}
