import Link from 'next/link'
import { TextoInterface } from './TraducaoCardapio'

export default function SecaoCardapioDestaque({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        📋 <TextoInterface chave="secao_cardapio">Cardápio</TextoInterface>
      </h2>
      <Link
        href={`/cardapio/${slug}`}
        className="inline-block rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        <TextoInterface chave="ver_cardapio_completo">Ver cardápio completo</TextoInterface> →
      </Link>
    </div>
  )
}
