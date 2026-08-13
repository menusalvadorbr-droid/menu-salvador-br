'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface ItemNav {
  href: string
  label: string
  icone: string
}

const NAV_GERAL: ItemNav[] = [
  { href: '/admin', label: 'Visão geral', icone: '📊' },
  { href: '/admin/estabelecimentos', label: 'Estabelecimentos', icone: '🏪' },
  { href: '/admin/estabelecimentos/importar', label: 'Importar em lote', icone: '📥' },
  { href: '/admin/estabelecimentos/pendencias', label: 'Bairros pendentes', icone: '📍' },
  { href: '/admin/claims', label: 'Reivindicações', icone: '📋' },
  { href: '/admin/contestacoes', label: 'Contestações', icone: '⚖️' },
  { href: '/admin/planos', label: 'Planos', icone: '💰' },
  { href: '/admin/temas', label: 'Temas', icone: '🎨' },
  // "Bairros" e "Cidades" não têm link próprio — a gestão fica dentro
  // dessa mesma tela (TiposManager + BairrosManager + CidadesManager
  // lado a lado), não em /admin/bairros ou /admin/cidades.
  { href: '/admin/tipos', label: 'Tipos, bairros e cidades', icone: '🏷️' },
]

const NAV_PLATAFORMA: ItemNav[] = [
  { href: '/admin/configuracoes', label: 'Configurações', icone: '⚙️' },
  { href: '/admin/traducoes-interface', label: 'Traduções da interface', icone: '🌐' },
  { href: '/admin/propagandas', label: 'Propaganda', icone: '📣' },
  { href: '/admin/logs', label: 'Logs', icone: '🗒️' },
  { href: '/admin/usuarios', label: 'Usuários', icone: '👥' },
]

function itemEstaAtivo(pathname: string, href: string) {
  // "/admin" é prefixo de toda rota do admin — comparação exata só pra
  // ele, senão "Visão geral" ficaria marcado como ativo em toda página.
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Secao({
  titulo,
  itens,
  pathname,
  aoNavegar,
}: {
  titulo: string
  itens: ItemNav[]
  pathname: string
  aoNavegar?: () => void
}) {
  return (
    <div>
      <p className="px-2 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-neutral-400 first:pt-0">
        {titulo}
      </p>
      <nav className="flex flex-col gap-0.5">
        {itens.map((item) => {
          const ativo = itemEstaAtivo(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={aoNavegar}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                ativo
                  ? 'bg-orange-50 font-medium text-orange-700'
                  : 'text-neutral-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <span>{item.icone}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function Marca() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-sm">
        🍽️
      </span>
      <span className="text-sm font-semibold text-neutral-900">Admin geral</span>
    </span>
  )
}

function IdentidadeAdmin({ nomeAdmin }: { nomeAdmin: string }) {
  return (
    <div className="px-2 pb-3">
      <p className="truncate text-sm font-medium text-neutral-900">{nomeAdmin}</p>
      <span className="mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
        Super admin
      </span>
    </div>
  )
}

/**
 * Navegação do /admin inteira — barra + drawer no mobile, sidebar fixa
 * no desktop, tudo num componente só (as classes `md:` decidem o que
 * aparece onde) pra não duplicar a lista de links em dois lugares.
 */
export default function AdminNav({ nomeAdmin }: { nomeAdmin: string }) {
  const pathname = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  // Trava o scroll da página por trás enquanto o drawer mobile está
  // aberto — sem isso dava pra rolar o conteúdo por baixo do overlay,
  // o que quebra a sensação de modal.
  useEffect(() => {
    if (!menuAberto) return
    const overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflowOriginal
    }
  }, [menuAberto])

  // Fecha o drawer sozinho quando a rota muda — cobre navegação que não
  // passa pelo onClick do link (botão voltar do navegador, por exemplo).
  // Comparado durante o render (não num effect) — padrão recomendado pra
  // "ajustar estado quando algo muda", sem o remontar+re-render extra de
  // um effect: https://react.dev/learn/you-might-not-need-an-effect
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname)
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname)
    setMenuAberto(false)
  }

  return (
    <>
      {/* Barra mobile: marca + hamburger — só existe abaixo de md */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <Link href="/admin">
          <Marca />
        </Link>
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-neutral-600 hover:bg-neutral-100"
        >
          ☰
        </button>
      </div>

      {/* Drawer mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-white px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between pb-2">
              <Link href="/admin" onClick={() => setMenuAberto(false)}>
                <Marca />
              </Link>
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <IdentidadeAdmin nomeAdmin={nomeAdmin} />
            <Secao titulo="Geral" itens={NAV_GERAL} pathname={pathname} aoNavegar={() => setMenuAberto(false)} />
            <Secao titulo="Plataforma" itens={NAV_PLATAFORMA} pathname={pathname} aoNavegar={() => setMenuAberto(false)} />

            <div className="mt-auto pt-4">
              <Link
                href="/painel"
                onClick={() => setMenuAberto(false)}
                className="block px-2 text-xs text-neutral-400 hover:text-neutral-600"
              >
                ← Voltar ao painel
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar desktop — sticky, com scroll próprio se a navegação
          crescer além da altura da tela. */}
      <aside className="hidden w-56 flex-shrink-0 flex-col self-start border-r border-neutral-200 bg-white px-3 py-4 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <Link href="/admin" className="px-2 pb-4">
          <Marca />
        </Link>

        <IdentidadeAdmin nomeAdmin={nomeAdmin} />
        <Secao titulo="Geral" itens={NAV_GERAL} pathname={pathname} />
        <Secao titulo="Plataforma" itens={NAV_PLATAFORMA} pathname={pathname} />

        <div className="mt-auto pt-4">
          <Link href="/painel" className="block px-2 text-xs text-neutral-400 hover:text-neutral-600">
            ← Voltar ao painel
          </Link>
        </div>
      </aside>
    </>
  )
}
