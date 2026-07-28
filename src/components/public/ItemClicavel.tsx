'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'

interface Alergeno {
  id: string
  nome: string
  icone: string | null
}

interface ItemClicavelProps {
  /** "Clique expande" ligado em Configurações → Recursos do cardápio. Desligado (padrão), renderiza só children, sem interação nenhuma. */
  ativado: boolean
  nome: string
  descricao: string | null
  fotoUrl: string | null
  preco: number
  precoPromocional?: number | null
  alergenos: Alergeno[]
  mostrarAlergenos: boolean
  corP: string
  corT: string
  corS: string
  corBd: string
  children: React.ReactNode
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Embrulha a parte informativa (foto + nome + descrição) de um item de
 * cardápio — não o preço/botão de comprar, que fica de fora e continua
 * funcionando normalmente — com um clique que abre um painel (bottom sheet)
 * com a versão ampliada: foto maior, nome completo, descrição sem cortar,
 * alérgenos. Reaproveitado nos dois layouts (Lista e Catálogo), já que o
 * comportamento é independente de tema.
 */
export default function ItemClicavel({
  ativado,
  nome,
  descricao,
  fotoUrl,
  preco,
  precoPromocional,
  alergenos,
  mostrarAlergenos,
  corP,
  corT,
  corS,
  corBd,
  children,
}: ItemClicavelProps) {
  const [aberto, setAberto] = useState(false)

  if (!ativado) return <>{children}</>

  const fotoGrande = getOptimizedCloudinaryUrl(fotoUrl, 600, 400, 'fill')
  const promoOk = precoPromocional != null && precoPromocional < preco

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberto(true) } }}
        className="cursor-pointer"
      >
        {children}
      </div>

      {/* Portal pro <body> — sem isso, esse painel "fixed" fica preso dentro
          do card do Modelo Catálogo, que tem hover:scale-105 (transform).
          Um transform no ancestral vira o "containing block" de qualquer
          descendente position:fixed; combinado com o overflow-hidden do
          card, o painel piscava e ficava cortado, ligado/desligado pelo
          próprio hover do card — daí também o clique de fechar não acertar
          (a área clicável real ficava deslocada). Portal tira o painel
          dessa árvore, anexando direto no <body>. */}
      {aberto && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setAberto(false)}
        >
          <div
            className="w-full max-w-lg min-h-[50vh] max-h-[80vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl"
            style={{ backgroundColor: corS, borderColor: corBd }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex justify-end p-2" style={{ backgroundColor: corS }}>
              <button
                onClick={() => setAberto(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {fotoGrande && (
              <div className="relative h-64 w-full bg-gray-100">
                <Image src={fotoGrande} alt={nome} fill className="object-cover" sizes="512px" unoptimized />
              </div>
            )}

            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold" style={{ color: corT }}>{nome}</h3>

              {descricao && (
                <p className="text-sm leading-relaxed opacity-80" style={{ color: corT }}>{descricao}</p>
              )}

              {mostrarAlergenos && alergenos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {alergenos.map((a) => (
                    <span key={a.id}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                      title={`Alérgeno: ${a.nome}`}>
                      {a.icone && <span>{a.icone}</span>}
                      {a.nome}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-1">
                {promoOk ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm line-through opacity-50" style={{ color: corT }}>R$ {fmt(preco)}</span>
                    <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(precoPromocional!)}</span>
                  </div>
                ) : (
                  <span className="text-xl font-bold" style={{ color: corP }}>R$ {fmt(preco)}</span>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * `onClick` num elemento de DOM só pode existir dentro de um Client
 * Component — `cardapio/[slug]/page.tsx` é Server Component, então não pode
 * escrever `<div onClick={...}>` direto (é exatamente isso que causava
 * "Event handlers cannot be passed to Client Component props" em runtime).
 * Esse wrapper existe só pra isolar o `stopPropagation()` que impede o
 * clique no botão de comprar de também abrir o painel do ItemClicavel que
 * embrulha a linha/card inteiro.
 */
export function PararPropagacaoClique({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  )
}
