'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PromoItemCard from './PromoItemCard'
import SpecialOfferCard from './SpecialOfferCard'
import { calcularEstadoOferta, algumaOfertaEncerrandoEmBreve, type EstadoOferta, type SpecialOfferRow } from '@/lib/specialOffers'
import { TextoInterface } from './TraducaoCardapio'

interface ItemComPromo {
  id: string
  nome: string
  descricao?: string | null
  preco: number
  preco_promocional: number
  foto_url: string | null
}

interface OfertaEmbed extends SpecialOfferRow {
  special_offer_itens: { itens_cardapio: { disponivel: boolean } | { disponivel: boolean }[] | null }[] | null
}

interface Props {
  estabelecimentoId: string
  promocoesContadorAtivado: boolean
  itensComPromo: ItemComPromo[]
  corP: string
  corT: string
  corF: string
  corS: string
  corBd: string
  cardRaio: string
}

/**
 * Carrossel "Promoções de hoje" — itens em promoção (itensComPromo, server-
 * fetched na página, cardápio inteiro já está no ISR de 120s então não tem
 * problema de frescor) + promoções com contador (special_offers, buscadas
 * aqui no cliente). special_offers precisa de dado sempre fresco — estado
 * ativo/anúncio/fora sensível ao horário e disponibilidade dos itens do
 * combo (esgotado) — e a página do cardápio tem ISR, então essa parte não
 * pode vir congelada no HTML cacheado (ver comentário em specialOffers.ts).
 */
export default function PromocoesContador({
  estabelecimentoId,
  promocoesContadorAtivado,
  itensComPromo,
  corP,
  corT,
  corF,
  corS,
  corBd,
  cardRaio,
}: Props) {
  const [ofertasVisiveis, setOfertasVisiveis] = useState<{ offer: SpecialOfferRow; estado: EstadoOferta }[]>([])

  useEffect(() => {
    if (!promocoesContadorAtivado) return
    let cancelado = false

    async function carregar() {
      const supabase = createClient()
      const { data: ofertasData } = await supabase
        .from('special_offers')
        .select('*, special_offer_itens(itens_cardapio(disponivel))')
        .eq('estabelecimento_id', estabelecimentoId)
        .eq('ativo', true)
      if (cancelado) return

      const visiveis: { offer: SpecialOfferRow; estado: EstadoOferta }[] = []
      for (const offer of (ofertasData as OfertaEmbed[]) || []) {
        const estado = calcularEstadoOferta(offer)
        if (estado.tipo === 'fora') continue
        const algumEsgotado = (offer.special_offer_itens || []).some((li) => {
          const item = Array.isArray(li.itens_cardapio) ? li.itens_cardapio[0] : li.itens_cardapio
          return item?.disponivel === false
        })
        if (algumEsgotado) continue
        visiveis.push({ offer, estado })
      }
      // Mais urgentes primeiro (quem termina mais cedo primeiro), ofertas só
      // anunciadas (sem "termina em" de verdade) por último.
      visiveis.sort((a, b) => {
        const fimA = a.estado.tipo === 'ativo' ? new Date(a.estado.fimIso).getTime() : Infinity
        const fimB = b.estado.tipo === 'ativo' ? new Date(b.estado.fimIso).getTime() : Infinity
        return fimA - fimB
      })
      setOfertasVisiveis(visiveis)
    }

    carregar()
    return () => { cancelado = true }
  }, [estabelecimentoId, promocoesContadorAtivado])

  if (itensComPromo.length === 0 && ofertasVisiveis.length === 0) return null

  const mostrarAlertaEncerrando = algumaOfertaEncerrandoEmBreve(ofertasVisiveis)

  return (
    <div className="rounded-2xl mb-4 overflow-hidden shadow"
      style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
      <div className="px-4 py-3 border-b flex items-center gap-2"
        style={{ backgroundColor: `${corP}15`, borderColor: corBd }}>
        <span className="text-base">🔥</span>
        <span className="text-sm font-semibold" style={{ color: corP }}>
          <TextoInterface chave="promocoes_hoje">Promoções de hoje</TextoInterface>
        </span>
        {mostrarAlertaEncerrando && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
            ⚠️ <TextoInterface chave="encerrando_breve">Encerrando em breve</TextoInterface>
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-3 py-3 scrollbar-none">
        {itensComPromo.map((item) => (
          <PromoItemCard key={item.id} item={item} corP={corP} corT={corT} corF={corF} corBd={corBd} cardRaio={cardRaio} />
        ))}
        {itensComPromo.length > 0 && ofertasVisiveis.length > 0 && (
          <div className="flex-shrink-0 w-px self-stretch my-1" style={{ backgroundColor: corBd }} />
        )}
        {ofertasVisiveis.map(({ offer, estado }) => (
          <SpecialOfferCard key={offer.id} offer={offer} estado={estado} corP={corP} corT={corT} corF={corF} corBd={corBd} />
        ))}
      </div>
    </div>
  )
}
