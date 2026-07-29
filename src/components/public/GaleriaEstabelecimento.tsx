'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTraducao } from './TraducaoCardapio'

export default function GaleriaEstabelecimento({ fotos, nome }: { fotos: string[]; nome: string }) {
  const fotosExibidas = fotos.slice(0, 10)
  const [selecionada, setSelecionada] = useState(0)
  const { traduzirInterface } = useTraducao()

  if (fotosExibidas.length === 0) {
    return <p className="text-sm text-neutral-500">{traduzirInterface('nenhuma_foto', 'Nenhuma foto disponível.')}</p>
  }

  return (
    <div>
      {/* Foto principal */}
      <div className="relative mb-2 aspect-[16/9] w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        <Image
          src={fotosExibidas[selecionada]}
          alt={`${nome} — foto ${selecionada + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 700px"
          className="object-cover"
        />
      </div>

      {/* Tira de miniaturas — só aparece se tiver mais de 1 foto */}
      {fotosExibidas.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotosExibidas.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelecionada(i)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === selecionada ? 'border-[var(--brand-primary)]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={url} alt={`Miniatura ${i + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
