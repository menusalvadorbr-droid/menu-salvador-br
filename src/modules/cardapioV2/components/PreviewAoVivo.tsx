'use client'

import { useEffect, useState } from 'react'
import { listarItensCompletos } from '../itemRepository'
import { listarRegrasDaCategoria } from '../regrasExibicaoRepository'
import { listarAlergenos } from '../alergenoRepository'
import CategoriaSecao from '@/components/cardapioV2/CategoriaSecao'
import { obterFonteTema } from '@/lib/fontesTema'
import type { CardapioV2Alergeno, CardapioV2Cardapio, CardapioV2CategoriaComItens, CardapioV2Categoria } from '../types'

/** Reusa os mesmos componentes de exibição da página pública (Fase 2) —
 * o preview nunca diverge do que o cliente de fato vê, porque é
 * literalmente o mesmo componente renderizando os mesmos dados. */
export default function PreviewAoVivo({
  categoria,
  cardapio,
}: {
  categoria: CardapioV2Categoria | null
  cardapio: CardapioV2Cardapio | null
}) {
  const [categoriaComItens, setCategoriaComItens] = useState<CardapioV2CategoriaComItens | null>(null)
  const [alergenos, setAlergenos] = useState<CardapioV2Alergeno[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Busca pontual ao trocar de categoria selecionada (não uma inscrição
    // em algo que muda sozinho).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!categoria) {
      setCategoriaComItens(null)
      return
    }
    setCarregando(true)
    Promise.all([listarItensCompletos([categoria.id]), listarRegrasDaCategoria(categoria.id), listarAlergenos()])
      .then(([itens, regras, alergenosLista]) => {
        setCategoriaComItens({ ...categoria, itens, regras })
        setAlergenos(alergenosLista)
      })
      .finally(() => setCarregando(false))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [categoria])

  if (!categoria) return <p className="text-sm text-neutral-400">Selecione uma categoria pra ver o preview.</p>
  if (carregando || !categoriaComItens || !cardapio) return <p className="text-sm text-neutral-400">Carregando preview…</p>

  // Mesmas cores/fonte/capa da página pública (Fase 6) — o preview usa o
  // cardápio de verdade, não uma prévia separada, então qualquer ajuste
  // de aparência aparece aqui na hora, igual ao cliente vai ver.
  const fonte = obterFonteTema(cardapio.fonte)

  return (
    <div
      className={`mx-auto max-w-sm overflow-hidden rounded-2xl border border-neutral-200 ${fonte.className}`}
      style={{ backgroundColor: cardapio.cor_fundo, color: cardapio.cor_texto }}
    >
      {cardapio.capa_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cardapio.capa_url} alt="" className="h-24 w-full object-cover" />
      )}
      <div className="p-4">
        <CategoriaSecao categoria={categoriaComItens} canal="presencial" alergenos={alergenos} cardapio={cardapio} agora={new Date()} />
      </div>
    </div>
  )
}
