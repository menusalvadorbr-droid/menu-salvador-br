'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import ContadorRegressivo from './ContadorRegressivo'
import { useUrgenciaOferta, type NivelUrgencia } from './useUrgenciaOferta'
import type { EstadoOferta, SpecialOfferRow } from '@/lib/specialOffers'
import { useTraducao } from './TraducaoCardapio'

interface SpecialOfferCardProps {
  offer: SpecialOfferRow
  estado: EstadoOferta
  corP: string
  corT: string
  corF: string
  corBd: string
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const BORDA: Record<NivelUrgencia, string> = {
  critico: 'border-2 border-red-500',
  urgente: 'border-2 border-amber-400',
  normal: 'border',
}
const SOMBRA: Record<NivelUrgencia, string> = {
  critico: 'shadow-lg shadow-red-500/40',
  urgente: 'shadow-lg shadow-amber-400/30',
  normal: '',
}
const VEU: Record<NivelUrgencia, string> = {
  critico: 'bg-red-500/25',
  urgente: 'bg-amber-400/20',
  normal: '',
}

/** Estado + contador/anúncio, reaproveitado igual no card fechado e no
 *  painel expandido — só muda o tamanho de fonte de fora pra dentro. */
function EstadoOfertaTexto({ estado, offer, corP, classeTexto }: {
  estado: EstadoOferta; offer: SpecialOfferRow; corP: string; classeTexto: string
}) {
  const { traduzirInterface } = useTraducao()
  if (estado.tipo === 'ativo') {
    return <ContadorRegressivo fimIso={estado.fimIso} alertaMinutos={offer.alerta_minutos} corP={corP} />
  }
  if (estado.tipo === 'sempre') {
    return (
      <span className={`${classeTexto} opacity-70 whitespace-nowrap`} style={{ color: corP }}>
        {traduzirInterface('sempre_disponivel', 'Sempre disponível')}
      </span>
    )
  }
  // 'fora' nunca chega aqui de verdade — SpecialOfferCard já retorna null
  // antes disso — mas o tipo de EstadoOferta inclui a variante mesmo assim.
  if (estado.tipo === 'fora') return null
  return (
    <span className={`${classeTexto} opacity-70 whitespace-nowrap`} style={{ color: corP }}>
      📅 {estado.texto}
    </span>
  )
}

/**
 * Card de "promoção com contador" (special_offers) — mesma casca visual do
 * card de item em promoção do carrossel "Promoções de hoje", mas com preço
 * de/por, selo de desconto automático, e o estado de exibição (anúncio ou
 * contador ao vivo, com tratamento visual mais forte quando urgente/crítico).
 * Clicar abre um painel expandido (mesmo padrão do ItemClicavel) com a foto
 * maior e a descrição completa, sem cortar.
 */
export default function SpecialOfferCard({ offer, estado, corP, corT, corF, corBd }: SpecialOfferCardProps) {
  // Hook sempre chamado (regra dos hooks), independente do estado — quando
  // a oferta não está "ativo" o resultado é descartado (nível forçado pra
  // 'normal' logo abaixo). Data fixa no futuro distante como placeholder
  // (em vez de calculada a partir de Date.now()) só pra não chamar função
  // impura direto no corpo do componente — o valor não importa nesse caso.
  const { nivel: nivelBruto } = useUrgenciaOferta(
    estado.tipo === 'ativo' ? estado.fimIso : '2099-01-01T00:00:00.000Z',
    offer.alerta_minutos
  )
  const { traduzirInterface } = useTraducao()
  const [aberto, setAberto] = useState(false)

  if (estado.tipo === 'fora') return null

  const nivel: NivelUrgencia = estado.tipo === 'ativo' ? nivelBruto : 'normal'
  const foto = getOptimizedCloudinaryUrl(offer.foto_url, 200, 200, 'fill')
  const fotoGrande = getOptimizedCloudinaryUrl(offer.foto_url, 700, 450, 'fill')

  // Selo de desconto automático — calculado de preco_de/preco_por, sem
  // precisar de um campo de porcentagem separado.
  const pct = offer.preco_de != null && offer.preco_de > offer.preco_por
    ? Math.round((1 - offer.preco_por / offer.preco_de) * 100)
    : 0

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberto(true) } }}
        // Mesma altura fixa (h-44) que o card de item do cardápio usa no
        // mesmo carrossel (cardapio/[slug]/page.tsx) — não uma altura própria.
        // Os dois tipos de card compartilham a mesma linha do flex; se cada
        // um tivesse sua própria altura, o align-items:stretch padrão
        // esticaria o mais baixo pra bater com o mais alto (foi o que
        // aconteceu antes: o card de item ficava esticado por causa deste
        // aqui). Com os dois já na mesma altura, stretch não tem efeito
        // nenhum, e é dessa altura compartilhada que aspect-square deriva a
        // largura do card_largo (quadrado de verdade: largura == altura).
        className={`flex-shrink-0 h-44 cursor-pointer ${offer.card_largo ? 'aspect-square' : 'w-32'} rounded-xl overflow-hidden ${BORDA[nivel]} ${SOMBRA[nivel]} transition ${
          estado.tipo === 'anuncio' ? 'opacity-60' : ''
        }`}
        // "sempre" (combo sem prazo) fica com aparência normal, sem o
        // esmaecido usado pra "ainda não começou" — não está esperando nada.
        style={nivel === 'normal' ? { backgroundColor: corF, borderColor: corBd } : { backgroundColor: corF }}
      >
        <div className="relative h-20 bg-gray-100">
          {foto ? (
            <Image src={foto} alt={offer.nome} fill className="object-cover" sizes="256px" unoptimized loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
          {/* véu translúcido — mesma cor da borda/sombra, sinaliza urgência sobre a foto */}
          {VEU[nivel] && <div className={`absolute inset-0 ${VEU[nivel]}`} />}
          {pct > 0 && (
            <span
              className="absolute top-1 left-1 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: corP }}
            >
              -{pct}%
            </span>
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium leading-tight line-clamp-2" style={{ color: corT }}>
            {offer.nome}
          </p>
          {offer.preco_de != null && (
            <p className="text-xs text-gray-400 line-through mt-0.5">R$ {fmt(offer.preco_de)}</p>
          )}
          <p className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(offer.preco_por)}</p>
          <div className="mt-1">
            <EstadoOfertaTexto estado={estado} offer={offer} corP={corP} classeTexto="text-xs" />
          </div>
        </div>
        {nivel !== 'normal' && (
          <div
            className={`px-2 py-1 text-center text-[11px] font-semibold ${
              nivel === 'critico' ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
            }`}
          >
            {nivel === 'critico'
              ? `🚨 ${traduzirInterface('ultimos_minutos', 'Últimos minutos!')}`
              : `⚡ ${traduzirInterface('encerrando_breve', 'Encerrando em breve')}`}
          </div>
        )}
      </div>

      {/* Portal pro <body> — mesmo motivo do ItemClicavel: um transform num
          ancestral (o carrossel/card não tem hoje, mas evita reintroduzir o
          bug se algum dia ganhar) vira containing block de position:fixed e
          corta/desalinha esse painel. */}
      {aberto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setAberto(false)}
        >
          <div
            className="relative flex w-full max-w-lg min-h-[40vh] max-h-[80vh] flex-col rounded-t-2xl border-t shadow-2xl overflow-hidden"
            style={{ backgroundColor: corF, borderColor: corBd }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAberto(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition"
              aria-label={traduzirInterface('fechar', 'Fechar')}
            >
              ✕
            </button>

            <div className="overflow-y-auto">
              {fotoGrande && (
                <div className="relative h-56 w-full bg-gray-100">
                  <Image src={fotoGrande} alt={offer.nome} fill className="object-cover" sizes="512px" unoptimized />
                  {pct > 0 && (
                    <span
                      className="absolute top-3 left-3 text-white text-sm font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: corP }}
                    >
                      -{pct}%
                    </span>
                  )}
                </div>
              )}

              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold" style={{ color: corT }}>{offer.nome}</h3>

                {offer.descricao && (
                  <p className="text-sm leading-relaxed opacity-80" style={{ color: corT }}>
                    {offer.descricao}
                  </p>
                )}

                <div className="flex items-baseline gap-2">
                  {offer.preco_de != null && (
                    <span className="text-sm line-through opacity-50" style={{ color: corT }}>R$ {fmt(offer.preco_de)}</span>
                  )}
                  <span className="text-2xl font-bold" style={{ color: corP }}>R$ {fmt(offer.preco_por)}</span>
                </div>

                <EstadoOfertaTexto estado={estado} offer={offer} corP={corP} classeTexto="text-sm" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
