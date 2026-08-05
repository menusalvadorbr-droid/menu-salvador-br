'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'
import { TextoInterface } from './TraducaoCardapio'

/** Só o spinner — precisa ser descendente do <Link>, não pode ler
 *  useLinkStatus no próprio Link (é o Link quem fornece o contexto). */
function Spinner() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

/**
 * Botão flutuante "← Categorias" da página de categoria — Client Component
 * só por causa do useLinkStatus (indicador de "carregando", já que aqui é
 * navegação de verdade pra outra página com busca no servidor, diferente
 * do painel do ItemClicavel que só muda estado local e é instantâneo).
 * active:scale-95 dá a confirmação imediata do toque; o spinner cobre a
 * espera real da navegação quando ela não é instantânea.
 */
export default function BotaoVoltarCategorias({
  href, corF, corP, corBd,
}: {
  href: string
  corF: string
  corP: string
  corBd: string
}) {
  return (
    <Link
      href={href}
      className="sticky top-3 z-20 mb-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-md transition hover:shadow-lg active:scale-95"
      style={{ backgroundColor: corF, color: corP, border: `1px solid ${corBd}` }}
    >
      ← <TextoInterface chave="voltar_categorias">Categorias</TextoInterface>
      <Spinner />
    </Link>
  )
}
