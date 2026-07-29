'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Fade + leve deslize de baixo pra cima quando a seção entra na tela
 * rolando (IntersectionObserver, mesmo padrão de scroll-spy já usado em
 * NavegacaoCategorias.tsx — observa em vez de recalcular a cada scroll).
 * Dispara uma única vez: depois que a seção já apareceu, fica visível
 * pra sempre, mesmo que o conteúdo interno mude (ex: troca de filtro).
 *
 * Não usar em volta de elementos position:fixed/sticky — o transform
 * aplicado durante a transição vira o "containing block" deles e quebra
 * o posicionamento (mesmo problema já documentado em ItemClicavel.tsx).
 */
export default function SecaoAnimada({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Sem suporte a IntersectionObserver, ou quem prefere menos
    // movimento: mostra direto, sem animação, em vez de arriscar ficar
    // invisível pra sempre. requestAnimationFrame (em vez de chamar
    // setState direto no corpo do effect) joga a atualização pra um
    // callback assíncrono.
    const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (typeof IntersectionObserver === 'undefined' || prefereReduzirMovimento) {
      const id = requestAnimationFrame(() => setVisivel(true))
      return () => cancelAnimationFrame(id)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)

    // Rede de segurança: alguns navegadores/WebViews (ex: in-app browser
    // do Instagram/Facebook no Android) têm um IntersectionObserver que
    // nunca dispara pra determinados elementos — sem isso, a seção ficava
    // presa em opacity-0 pra sempre nesses casos (conteúdo real no HTML,
    // mas invisível). Se o observer não avisar em 2s, revela do mesmo
    // jeito — pior caso é perder a animação, nunca o conteúdo.
    const timeoutId = setTimeout(() => setVisivel(true), 2000)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visivel ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className || ''}`}
    >
      {children}
    </div>
  )
}
