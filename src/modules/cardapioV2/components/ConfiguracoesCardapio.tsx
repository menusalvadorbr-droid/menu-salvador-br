'use client'

import { useState } from 'react'
import { atualizarRecursosOpcionais } from '../cardapioRepository'
import type { CardapioV2Cardapio, RecursosOpcionaisCardapio } from '../types'

const RECURSOS: { chave: keyof RecursosOpcionaisCardapio; titulo: string; descricao: string }[] = [
  { chave: 'alergenos_ativado', titulo: 'Alérgenos', descricao: 'Mostra os selos de alérgenos no cardápio público e libera o campo no formulário do item.' },
  { chave: 'info_nutricional_ativado', titulo: 'Informação nutricional', descricao: 'Mostra a observação nutricional (ex: "450 kcal por porção") no cardápio público.' },
  { chave: 'tags_ativado', titulo: 'Tags (vegano, sem glúten...)', descricao: 'Mostra as tags livres do item como selos no cardápio público.' },
  { chave: 'traducao_ativado', titulo: 'Tradução manual', descricao: 'Libera o editor de tradução por idioma no formulário do item.' },
]

/**
 * Cada recurso vem desligado por padrão (ver migração
 * 20260906c_cardapio_v2_recursos_opcionais.sql) — mesmo princípio do V1
 * pra recursos opcionais do cardápio (cardapio_variacoes_ativado etc. em
 * estabelecimentos): o dono só vê o que decidiu usar.
 */
export default function ConfiguracoesCardapio({
  cardapio,
  onAtualizado,
}: {
  cardapio: CardapioV2Cardapio
  onAtualizado: (cardapio: CardapioV2Cardapio) => void
}) {
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null)

  async function alternar(chave: keyof RecursosOpcionaisCardapio) {
    const novoValor = !cardapio[chave]
    setSalvandoChave(chave)
    try {
      await atualizarRecursosOpcionais(cardapio.id, { [chave]: novoValor })
      onAtualizado({ ...cardapio, [chave]: novoValor })
    } finally {
      setSalvandoChave(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {RECURSOS.map((recurso) => (
        <label
          key={recurso.chave}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <input
            type="checkbox"
            checked={cardapio[recurso.chave]}
            disabled={salvandoChave === recurso.chave}
            onChange={() => alternar(recurso.chave)}
            className="mt-0.5 h-4 w-4"
          />
          <div>
            <p className="text-sm font-medium text-neutral-800">{recurso.titulo}</p>
            <p className="text-xs text-neutral-500">{recurso.descricao}</p>
          </div>
        </label>
      ))}
    </div>
  )
}
