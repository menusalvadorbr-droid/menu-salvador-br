'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Banknote } from 'lucide-react'
import { registrarMovimentacaoCaixa } from '../caixaRepository'
import type { MovimentacaoCaixa, TipoMovimentacaoCaixa } from '../types'
import InputMoeda from './InputMoeda'
import { caixaTema } from '../caixaTema'

const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/**
 * Sangria (retirada de dinheiro da gaveta) e suprimento (reforço de troco)
 * — item padrão em qualquer PDV, hoje ausente da tela. Sem isso o "valor
 * esperado" no fechamento nunca bate quando o operador tira dinheiro da
 * gaveta no meio do turno pra outra finalidade.
 */
export default function MovimentacoesCaixa({
  estabelecimentoId,
  caixaSessaoId,
  movimentacoes,
  onRegistrada,
}: {
  estabelecimentoId: string
  caixaSessaoId: string
  movimentacoes: MovimentacaoCaixa[]
  onRegistrada: () => void | Promise<void>
}) {
  const [modalAberto, setModalAberto] = useState<TipoMovimentacaoCaixa | null>(null)
  const [valor, setValor] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function fecharModal() {
    setModalAberto(null)
    setValor(0)
    setMotivo('')
    setErro(null)
  }

  async function confirmar() {
    if (!modalAberto || valor <= 0) return
    setEnviando(true)
    setErro(null)
    try {
      await registrarMovimentacaoCaixa(estabelecimentoId, caixaSessaoId, modalAberto, valor, motivo)
      fecharModal()
      await onRegistrada()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao registrar movimentação')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={`${caixaTema.painel} p-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Banknote className="h-4 w-4 text-neutral-400" /> Sangrias e suprimentos
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setModalAberto('suprimento')}
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 transition hover:bg-sky-500/20"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" /> Suprimento
          </button>
          <button
            onClick={() => setModalAberto('sangria')}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" /> Sangria
          </button>
        </div>
      </div>

      {movimentacoes.length === 0 ? (
        <p className="text-xs text-neutral-500">Nenhuma movimentação registrada nesta sessão.</p>
      ) : (
        <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {movimentacoes.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="w-12 flex-shrink-0 font-mono text-neutral-500">{fmtHora(m.created_at)}</span>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 font-semibold ${
                  m.tipo === 'sangria' ? caixaTema.badgeAlerta : caixaTema.badgeInfo
                }`}
              >
                {m.tipo === 'sangria' ? 'Sangria' : 'Suprimento'}
              </span>
              <span className="flex-1 truncate text-neutral-400">{m.motivo || '—'}</span>
              <span className={`flex-shrink-0 font-semibold ${m.tipo === 'sangria' ? 'text-amber-400' : 'text-sky-400'}`}>
                {m.tipo === 'sangria' ? '−' : '+'} R$ {m.valor.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={fecharModal} />
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {modalAberto === 'sangria' ? '− Registrar sangria' : '+ Registrar suprimento'}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {modalAberto === 'sangria'
                ? 'Retirada de dinheiro da gaveta — ex: depósito, pagamento a fornecedor.'
                : 'Reforço de troco colocado na gaveta durante o turno.'}
            </p>

            {erro && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>
            )}

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-neutral-400">Valor</label>
              <InputMoeda value={valor} onChange={setValor} autoFocus className={`w-full ${caixaTema.input}`} />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-neutral-400">
                Motivo <span className="font-normal opacity-70">(opcional)</span>
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Troco, pagamento entregador..."
                className={`w-full ${caixaTema.input}`}
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={fecharModal}
                disabled={enviando}
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-700 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={enviando || valor <= 0}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition disabled:opacity-40 ${
                  modalAberto === 'sangria' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-600 hover:bg-sky-500'
                }`}
              >
                {enviando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
