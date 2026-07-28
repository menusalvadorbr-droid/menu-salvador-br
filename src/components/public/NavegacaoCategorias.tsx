'use client'

import { useEffect, useRef, useState } from 'react'
import { Texto } from './TraducaoCardapio'

interface CategoriaNav {
  id: string
  nome: string
}

interface NavegacaoCategoriasProps {
  categorias: CategoriaNav[]
  corP: string
  corF: string
  corBd: string
}

/**
 * Barra sticky de pílulas de categoria — scroll-spy: observa as seções
 * (`#cat-<id>`) pra saber qual está visível e destacar a pílula
 * correspondente, tanto ao clicar quanto ao rolar manualmente a página. A
 * pílula ativa também rola sozinha (só o eixo horizontal da barra, não a
 * página) até ficar visível quando cai fora da área visível da barra.
 */
export default function NavegacaoCategorias({ categorias, corP, corF, corBd }: NavegacaoCategoriasProps) {
  const [ativa, setAtiva] = useState<string | null>(categorias[0]?.id ?? null)
  const [topoHeader, setTopoHeader] = useState(0)
  const [obstrucaoTopo, setObstrucaoTopo] = useState(0) // header + esta barra, juntos
  const containerRef = useRef<HTMLDivElement>(null)
  const pillsRef = useRef<Record<string, HTMLAnchorElement | null>>({})

  // O <header> do site (PublicHeader) também é sticky top-0 e z-40 — sem
  // medir a altura dele e descontar aqui, essa barra tentava grudar no
  // mesmo top:0, e o header (z-index maior) ficava por cima, escondendo a
  // barra de categorias assim que os dois "grudavam" juntos no topo.
  // Medido em vez de fixo: a altura do header varia (o banner promocional
  // acima dele só aparece pra quem não está logado).
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

    // Faixa próxima do topo (logo abaixo do header + desta barra) decide
    // qual seção conta como "ativa" — sem isso (threshold cobrindo a
    // viewport inteira), categorias curtas nunca disparariam ou duas
    // ficariam ativas ao mesmo tempo.
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

  // Salto nativo do <a href="#cat-id"> é instantâneo (um scrollTop enorme
  // de uma vez): Safari/Chrome às vezes não recalculam a posição de um
  // position:sticky a tempo depois de um salto grande desses, e a barra
  // some até o usuário rolar mais um pouco (o que força o recálculo). Faz
  // o próprio scroll pelo JS com behavior:'smooth' em vez do salto nativo
  // — a animação dá tempo do browser recalcular o sticky a cada frame, sem
  // esse bug. Usa obstrucaoTopo (header + esta barra, medidos) em vez do
  // scroll-mt-20 estático da seção — mais preciso, já que a altura do
  // header varia (banner promocional só aparece pra quem não está logado).
  function irParaCategoria(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    setAtiva(id)
    const el = document.getElementById(`cat-${id}`)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - obstrucaoTopo - 8
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  return (
    <div
      ref={containerRef}
      className="sticky z-30 -mx-4 px-4 py-2 mb-4 flex gap-2 overflow-x-auto scrollbar-none backdrop-blur-md border-b"
      style={{ top: topoHeader, backgroundColor: `${corF}ee`, borderColor: corBd }}
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
            style={
              estaAtiva
                ? { backgroundColor: corP, color: '#fff' }
                : { backgroundColor: `${corP}15`, color: corP }
            }
          >
            <Texto tipo="categoria" id={cat.id} campo="nome">{cat.nome}</Texto>
          </a>
        )
      })}
    </div>
  )
}
