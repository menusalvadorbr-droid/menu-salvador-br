'use client'

import type { ReactNode } from 'react'

const CORES = {
  amber: { borda: 'border-amber-200', fundo: 'bg-amber-50/60', titulo: 'text-amber-800', texto: 'text-amber-600' },
  sky: { borda: 'border-sky-200', fundo: 'bg-sky-50/60', titulo: 'text-sky-800', texto: 'text-sky-600' },
  neutral: { borda: 'border-neutral-200', fundo: 'bg-neutral-50', titulo: 'text-neutral-800', texto: 'text-neutral-500' },
} as const

/** Wrapper repetido pelas 3 seções da Fila do Operador (IA/Pix/Validar
 *  entrega) — só a cor de destaque mudava entre elas, o resto (título com
 *  contagem, estado carregando/vazio, lista) era o mesmo código colado 3
 *  vezes. */
export default function PainelSecao({
  cor,
  titulo,
  contagem,
  mostrarTitulo = true,
  carregando,
  vazio,
  acao,
  children,
}: {
  cor: keyof typeof CORES
  titulo: string
  contagem: number
  mostrarTitulo?: boolean
  carregando: boolean
  vazio: string
  acao?: ReactNode
  children: ReactNode
}) {
  const c = CORES[cor]

  return (
    <section className={`rounded-2xl border ${c.borda} ${c.fundo} p-4 shadow-sm`}>
      {mostrarTitulo && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className={`text-sm font-bold ${c.titulo}`}>
            {titulo} <span className={`font-normal ${c.texto}`}>({contagem})</span>
          </h2>
          {acao}
        </div>
      )}
      {carregando ? (
        <p className={`text-sm ${c.texto}`}>Carregando...</p>
      ) : contagem === 0 ? (
        <p className={`text-sm ${c.texto}`}>{vazio}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </section>
  )
}
