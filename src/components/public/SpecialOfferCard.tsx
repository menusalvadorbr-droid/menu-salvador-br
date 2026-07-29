'use client'

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

/**
 * Card de "promoção com contador" (special_offers) — mesma casca visual do
 * card de item em promoção do carrossel "Promoções de hoje", mas com preço
 * de/por, selo de desconto automático, e o estado de exibição (anúncio ou
 * contador ao vivo, com tratamento visual mais forte quando urgente/crítico).
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

  if (estado.tipo === 'fora') return null

  const nivel: NivelUrgencia = estado.tipo === 'ativo' ? nivelBruto : 'normal'
  const foto = getOptimizedCloudinaryUrl(offer.foto_url, 200, 200, 'fill')

  // Selo de desconto automático — calculado de preco_de/preco_por, sem
  // precisar de um campo de porcentagem separado.
  const pct = offer.preco_de != null && offer.preco_de > offer.preco_por
    ? Math.round((1 - offer.preco_por / offer.preco_de) * 100)
    : 0

  return (
    <div
      // Mesma altura fixa (h-44) que o card de item do cardápio usa no
      // mesmo carrossel (cardapio/[slug]/page.tsx) — não uma altura própria.
      // Os dois tipos de card compartilham a mesma linha do flex; se cada
      // um tivesse sua própria altura, o align-items:stretch padrão
      // esticaria o mais baixo pra bater com o mais alto (foi o que
      // aconteceu antes: o card de item ficava esticado por causa deste
      // aqui). Com os dois já na mesma altura, stretch não tem efeito
      // nenhum, e é dessa altura compartilhada que aspect-square deriva a
      // largura do card_largo (quadrado de verdade: largura == altura).
      className={`flex-shrink-0 h-44 ${offer.card_largo ? 'aspect-square' : 'w-32'} rounded-xl overflow-hidden ${BORDA[nivel]} ${SOMBRA[nivel]} transition ${
        estado.tipo === 'anuncio' ? 'opacity-60' : ''
      }`}
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
          {estado.tipo === 'ativo' ? (
            <ContadorRegressivo fimIso={estado.fimIso} alertaMinutos={offer.alerta_minutos} corP={corP} />
          ) : (
            <span className="text-xs opacity-70 whitespace-nowrap" style={{ color: corP }}>
              📅 {estado.texto}
            </span>
          )}
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
  )
}
