'use client'

import { useEffect, useState } from 'react'
import { definirRegra, listarRegrasDoItem, removerRegra } from '../regrasExibicaoRepository'
import type { CardapioV2RegraExibicao } from '../types'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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

  const [diasSemana, setDiasSemana] = useState<number[]>(disponibilidade?.dias_semana ?? [])
  const [horarioDe, setHorarioDe] = useState(disponibilidade?.horario_de ?? '')
  const [horarioAte, setHorarioAte] = useState(disponibilidade?.horario_ate ?? '')
  const [precoPromo, setPrecoPromo] = useState(promocao?.promocao_preco?.toString() ?? '')
  const [promoAte, setPromoAte] = useState(promocao?.promocao_valida_ate?.slice(0, 16) ?? '')
  const [destaqueAtivo, setDestaqueAtivo] = useState(!!destaque?.destaque)

  useEffect(() => {
    // Ressincroniza os campos do formulário quando as regras recarregam
    // (não uma inscrição em algo que muda sozinho).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDiasSemana(disponibilidade?.dias_semana ?? [])
    setHorarioDe(disponibilidade?.horario_de ?? '')
    setHorarioAte(disponibilidade?.horario_ate ?? '')
    setPrecoPromo(promocao?.promocao_preco?.toString() ?? '')
    setPromoAte(promocao?.promocao_valida_ate?.slice(0, 16) ?? '')
    setDestaqueAtivo(!!destaque?.destaque)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regras])

  async function salvarDisponibilidade() {
    await definirRegra(estabelecimentoId, { item_id: itemId }, 'disponibilidade', {
      dias_semana: diasSemana.length ? diasSemana : null,
      horario_de: horarioDe || null,
      horario_ate: horarioAte || null,
      disponivel: true,
    })
    await recarregar()
  }

  async function salvarPromocao() {
    if (!precoPromo) {
      await removerRegra(estabelecimentoId, { item_id: itemId }, 'promocao')
    } else {
      await definirRegra(estabelecimentoId, { item_id: itemId }, 'promocao', {
        promocao_preco: Number(precoPromo),
        promocao_valida_ate: promoAte ? new Date(promoAte).toISOString() : null,
      })
    }
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
        <div className="flex flex-wrap gap-1">
          {DIAS.map((dia, index) => (
            <button
              key={dia}
              type="button"
              onClick={() => setDiasSemana((atual) => (atual.includes(index) ? atual.filter((d) => d !== index) : [...atual, index]))}
              className={`rounded px-2 py-1 text-xs ${diasSemana.includes(index) ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'}`}
            >
              {dia}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <input type="time" value={horarioDe} onChange={(e) => setHorarioDe(e.target.value)} className="rounded-lg border border-neutral-200 px-2 py-1 text-xs" />
          <span className="text-xs text-neutral-400">até</span>
          <input type="time" value={horarioAte} onChange={(e) => setHorarioAte(e.target.value)} className="rounded-lg border border-neutral-200 px-2 py-1 text-xs" />
          <button onClick={salvarDisponibilidade} className="ml-auto text-xs font-medium text-orange-600">Salvar</button>
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-400">Sem dia/horário marcado = disponível sempre.</p>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-neutral-700">Promoção</p>
        <div className="flex items-center gap-2">
          <input
            type="number" step="0.01" placeholder="Preço promocional"
            value={precoPromo} onChange={(e) => setPrecoPromo(e.target.value)}
            className="w-32 rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
          <input
            type="datetime-local" value={promoAte} onChange={(e) => setPromoAte(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
          <button onClick={salvarPromocao} className="ml-auto text-xs font-medium text-orange-600">Salvar</button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
        <input type="checkbox" checked={destaqueAtivo} onChange={alternarDestaque} />
        Destacar este item no cardápio
      </label>
    </div>
  )
}
