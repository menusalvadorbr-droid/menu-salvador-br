'use client'

import { useEffect, useState } from 'react'
import { definirRegra, listarRegrasDoItem, removerRegra } from '../regrasExibicaoRepository'
import AgendamentoRegraCampos, { agendamentoVazio, type AgendamentoRegra } from './AgendamentoRegraCampos'
import type { CardapioV2RegraExibicao } from '../types'

/** Converte os campos de <input> pro shape de gravação — string vazia vira
 *  null (sem restrição naquele campo), lista vazia de dias vira null. */
function agendamentoParaRegra(agendamento: AgendamentoRegra) {
  return {
    dias_semana: agendamento.diasSemana.length ? agendamento.diasSemana : null,
    horario_de: agendamento.horarioDe || null,
    horario_ate: agendamento.horarioAte || null,
  }
}

/** Disponibilidade + promoção + destaque unificados na mesma tabela (ver
 * cardapio_v2_regras_exibicao) — este editor só muda qual `tipo` está
 * sendo gravado, a leitura/gravação é sempre a mesma tabela. */
export default function RegraExibicaoEditor({ estabelecimentoId, itemId }: { estabelecimentoId: string; itemId: string }) {
  const [regras, setRegras] = useState<CardapioV2RegraExibicao[]>([])
  const [carregando, setCarregando] = useState(true)

  async function recarregar() {
    setRegras(await listarRegrasDoItem(itemId))
  }

  useEffect(() => {
    // Busca pontual ao trocar de item (não uma inscrição em algo que muda
    // sozinho).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar().finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  const disponibilidade = regras.find((r) => r.tipo === 'disponibilidade') ?? null
  const promocao = regras.find((r) => r.tipo === 'promocao') ?? null
  const destaque = regras.find((r) => r.tipo === 'destaque') ?? null

  const [agendaDisponibilidade, setAgendaDisponibilidade] = useState<AgendamentoRegra>(agendamentoVazio())
  const [agendaPromocao, setAgendaPromocao] = useState<AgendamentoRegra>(agendamentoVazio())
  const [precoPromo, setPrecoPromo] = useState('')
  const [destaqueAtivo, setDestaqueAtivo] = useState(!!destaque?.destaque)

  useEffect(() => {
    // Ressincroniza os campos do formulário quando as regras recarregam
    // (não uma inscrição em algo que muda sozinho).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAgendaDisponibilidade({
      diasSemana: disponibilidade?.dias_semana ?? [],
      horarioDe: disponibilidade?.horario_de ?? '',
      horarioAte: disponibilidade?.horario_ate ?? '',
      validaAte: '',
    })
    setAgendaPromocao({
      diasSemana: promocao?.dias_semana ?? [],
      horarioDe: promocao?.horario_de ?? '',
      horarioAte: promocao?.horario_ate ?? '',
      validaAte: promocao?.promocao_valida_ate?.slice(0, 16) ?? '',
    })
    setPrecoPromo(promocao?.promocao_preco?.toString() ?? '')
    setDestaqueAtivo(!!destaque?.destaque)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regras])

  async function salvarDisponibilidade() {
    await definirRegra(estabelecimentoId, { item_id: itemId }, 'disponibilidade', {
      ...agendamentoParaRegra(agendaDisponibilidade),
      disponivel: true,
    })
    await recarregar()
  }

  async function salvarPromocao() {
    if (!precoPromo) {
      await removerRegra(estabelecimentoId, { item_id: itemId }, 'promocao')
    } else {
      await definirRegra(estabelecimentoId, { item_id: itemId }, 'promocao', {
        ...agendamentoParaRegra(agendaPromocao),
        promocao_preco: Number(precoPromo),
        promocao_valida_ate: agendaPromocao.validaAte ? new Date(agendaPromocao.validaAte).toISOString() : null,
      })
    }
    await recarregar()
  }

  /** Pausa/reativa a promoção sem apagar preço/agenda configurados —
   *  diferente de limpar o preço (que remove a regra de vez). */
  async function alternarAtivoPromocao() {
    if (!promocao) return
    await definirRegra(estabelecimentoId, { item_id: itemId }, 'promocao', {
      ...agendamentoParaRegra(agendaPromocao),
      promocao_preco: promocao.promocao_preco,
      promocao_valida_ate: promocao.promocao_valida_ate,
      ativo: !promocao.ativo,
    })
    await recarregar()
  }

  async function alternarDestaque() {
    const novoValor = !destaqueAtivo
    setDestaqueAtivo(novoValor)
    if (novoValor) {
      await definirRegra(estabelecimentoId, { item_id: itemId }, 'destaque', { destaque: true })
    } else {
      await removerRegra(estabelecimentoId, { item_id: itemId }, 'destaque')
    }
  }

  if (carregando) return <p className="text-xs text-neutral-400">Carregando regras…</p>

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-3">
      <div>
        <p className="mb-1 text-xs font-semibold text-neutral-700">Disponibilidade programada</p>
        <AgendamentoRegraCampos
          valor={agendaDisponibilidade}
          onChange={(v) => setAgendaDisponibilidade({ ...v, validaAte: '' })}
        />
        <button onClick={salvarDisponibilidade} className="mt-1.5 text-xs font-medium text-orange-600">Salvar</button>
        <p className="mt-0.5 text-[11px] text-neutral-400">Sem dia/horário marcado = disponível sempre.</p>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-neutral-700">
          Promoção {promocao && !promocao.ativo && <span className="font-normal text-neutral-400">(pausada)</span>}
        </p>
        <input
          type="number" step="0.01" placeholder="Preço promocional"
          value={precoPromo} onChange={(e) => setPrecoPromo(e.target.value)}
          className="mb-2 w-40 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
        />
        {/* Agendamento só faz sentido com um preço definido — sem isso não
            há promoção nenhuma pra agendar. */}
        {precoPromo && (
          <AgendamentoRegraCampos valor={agendaPromocao} onChange={setAgendaPromocao} />
        )}
        <div className="mt-1.5 flex items-center gap-3">
          <button onClick={salvarPromocao} className="text-xs font-medium text-orange-600">Salvar</button>
          {promocao && (
            <button onClick={alternarAtivoPromocao} className="text-xs font-medium text-neutral-500 hover:text-neutral-700">
              {promocao.ativo ? 'Pausar' : 'Reativar'}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          Ex: Happy Hour — preço promocional + dias/horário. Sem dia/horário marcado = promoção vale o tempo todo (até a data de validade, se houver).
          {promocao && ' "Pausar" mantém preço e agenda salvos, só some da página pública até reativar — pra apagar de vez, limpe o preço e clique em Salvar.'}
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
        <input type="checkbox" checked={destaqueAtivo} onChange={alternarDestaque} />
        Destacar este item no cardápio
      </label>
    </div>
  )
}
