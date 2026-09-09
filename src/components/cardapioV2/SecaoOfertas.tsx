'use client'

import Image from 'next/image'
import { getCloudflareImageUrl } from '@/lib/cloudflareImage'
import { resolverEstadoOferta, ofertaEncerrandoEmBreve } from '@/modules/cardapioV2/ofertasEstado'
import { useUrgenciaOferta } from '@/components/public/useUrgenciaOferta'
import { formatarReais } from '@/lib/moeda'
import type { OfertaComRegra } from '@/modules/cardapioV2/ofertasRepository'

/** Contador ao vivo — só existe quando a oferta tem um fim conhecido
 *  (`tipo: 'ativo'`); separado num componente próprio porque
 *  useUrgenciaOferta precisa do fimIso como string fixa, não recalculado a
 *  cada render do card inteiro. */
function Contador({ fimIso, alertaMinutos }: { fimIso: string; alertaMinutos: number }) {
  const { mins, nivel } = useUrgenciaOferta(fimIso, alertaMinutos)
  if (mins <= 0) return null

  const horas = Math.floor(mins / 60)
  const minutosRestantes = mins % 60
  const texto = horas > 0 ? `${horas}h ${minutosRestantes}min` : `${minutosRestantes}min`

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        nivel === 'critico' ? 'bg-red-100 text-red-700' : nivel === 'urgente' ? 'bg-amber-100 text-amber-800' : 'bg-white/90 text-neutral-700'
      }`}
    >
      ⏱ termina em {texto}
    </span>
  )
}

function CardOferta({ item, corPrimaria }: { item: OfertaComRegra; corPrimaria: string }) {
  const estado = resolverEstadoOferta(item.regra, new Date())
  if (estado.tipo === 'fora') return null

  const fotoUrl = getCloudflareImageUrl(item.oferta.foto_url, { width: 400, height: 300 })
  const urgente = estado.tipo === 'ativo' && ofertaEncerrandoEmBreve(estado, item.oferta.alerta_minutos)

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${item.oferta.card_largo ? 'col-span-2' : ''} ${
        urgente ? 'border-amber-300' : 'border-neutral-200'
      }`}
    >
      <div className="relative h-32 bg-neutral-100">
        {fotoUrl ? (
          <Image src={fotoUrl} alt={item.oferta.nome} fill sizes="400px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🎉</div>
        )}
        {estado.tipo === 'ativo' && (
          <div className="absolute bottom-2 left-2">
            <Contador fimIso={estado.fimIso} alertaMinutos={item.oferta.alerta_minutos} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-neutral-900">{item.oferta.nome}</h3>
        {item.oferta.descricao && <p className="mt-0.5 text-xs text-neutral-500">{item.oferta.descricao}</p>}
        <div className="mt-1.5 flex items-baseline gap-2">
          {item.oferta.preco_de && (
            <span className="text-xs text-neutral-400 line-through">R$ {formatarReais(item.oferta.preco_de)}</span>
          )}
          <span className="text-base font-bold" style={{ color: corPrimaria }}>
            R$ {formatarReais(item.oferta.preco_por)}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Combos ativos do Cardápio V2 — cada card resolve seu próprio estado
 *  (resolverEstadoOferta) e se esconde sozinho quando fora da janela; a
 *  seção inteira some se nenhum combo estiver visível agora. */
export default function SecaoOfertas({ ofertas, corPrimaria }: { ofertas: OfertaComRegra[]; corPrimaria: string }) {
  if (ofertas.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-bold" style={{ color: corPrimaria }}>
        🎉 Combos e ofertas
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {ofertas.map((item) => (
          <CardOferta key={item.oferta.id} item={item} corPrimaria={corPrimaria} />
        ))}
      </div>
    </section>
  )
}
