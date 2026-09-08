'use client'

import { useEffect, useRef, useState } from 'react'

interface CategoriaNav {
  id: string
  nome: string
}

/**
 * Barra sticky de pílulas de categoria pro Cardápio V2 — mesma mecânica de
 * scroll-spy/auto-scroll/sticky de src/components/public/NavegacaoCategorias.tsx
 * (V1), portada aqui em vez de reaproveitada direto porque é código de
 * domínio do cardápio (regra de isolamento do V2 — ver AGENTS.md), e sem o
 * wrapper <Texto> de tradução (a página V2 não garante TraducaoProvider por
 * fora fora do canal delivery, só mostra o nome puro por enquanto).
 *
 * Convive com NavegacaoCategoriasV2 (o ☰ no cabeçalho) — os dois ficam
 * ligados ao mesmo tempo, sem gate de plano: pílulas fazem parte do
 * cardápio grátis.
 */
export default function NavegacaoPilulasV2({ categorias, corPrimaria, corFundo }: { categorias: CategoriaNav[]; corPrimaria: string; corFundo: string }) {
  const [ativa, setAtiva] = useState<string | null>(categorias[0]?.id ?? null)
  const [topoHeader, setTopoHeader] = useState(0)
  const [obstrucaoTopo, setObstrucaoTopo] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<Record<string, HTMLAnchorElement | null>>({})

  // O <header> da página do cardápio V2 também é sticky top-0 — sem medir a
  // altura dele e descontar aqui, esta barra tentava grudar no mesmo top:0
  // e ficava escondida atrás dele. Medido em vez de fixo porque a altura
  // varia com/sem logo.
  useEffect(() => {
    function medir() {
      const alturaHeader = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      setTopoHeader(alturaHeader)
      const alturaBarra = containerRef.current?.getBoundingClientRect().height ?? 0
      setObstrucaoTopo(alturaHeader + alturaBarra)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    const elementos = categorias
      .map((cat) => document.getElementById(`cat-${cat.id}`))
      .filter((el): el is HTMLElement => !!el)

    if (elementos.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visiveis = entries.filter((e) => e.isIntersecting)
        if (visiveis.length === 0) return
        const maisAoTopo = visiveis.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setAtiva(maisAoTopo.target.id.replace('cat-', ''))
      },
      { rootMargin: `-${obstrucaoTopo + 16}px 0px -70% 0px`, threshold: 0 }
    )
    elementos.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categorias, obstrucaoTopo])

  useEffect(() => {
    if (!ativa) return
    const pill = pillsRef.current[ativa]
    const container = containerRef.current
    if (!pill || !container) return

    const inicioPill = pill.offsetLeft
    const fimPill = inicioPill + pill.offsetWidth
    const inicioVisivel = container.scrollLeft
    const fimVisivel = inicioVisivel + container.clientWidth

    if (inicioPill < inicioVisivel || fimPill > fimVisivel) {
      container.scrollTo({
        left: inicioPill - container.clientWidth / 2 + pill.offsetWidth / 2,
        behavior: 'smooth',
      })
    }
  }, [ativa])

  // Scroll pelo JS (não o salto nativo do <a href>) pelo mesmo motivo do
  // V1: salto instantâneo grande às vezes atrasa o recálculo de
  // position:sticky no Safari/Chrome, e a barra some até rolar de novo.
  function irParaCategoria(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    setAtiva(id)
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - obstrucaoTopo - 8
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  if (categorias.length < 2) return null

  return (
    <div
      ref={containerRef}
      className="sticky z-20 -mx-4 mb-4 flex gap-2 overflow-x-auto border-b px-4 py-2 backdrop-blur-md"
      style={{ top: topoHeader, backgroundColor: `${corFundo}ee`, borderColor: `${corPrimaria}20` }}
    >
      {categorias.map((cat) => {
        const estaAtiva = ativa === cat.id
        return (
          <a
            key={cat.id}
            ref={(el) => { pillsRef.current[cat.id] = el }}
            href={`#cat-${cat.id}`}
            onClick={(e) => irParaCategoria(e, cat.id)}
            className="flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition"
            style={estaAtiva ? { backgroundColor: corPrimaria, color: '#fff' } : { backgroundColor: `${corPrimaria}15`, color: corPrimaria }}
          >
            {cat.nome}
          </a>
        )
      })}
    </div>
  )
}
