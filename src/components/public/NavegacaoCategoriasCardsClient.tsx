'use client'

import { useCardapioPublico } from './useCardapioPublico'
import NavegacaoCategoriasCards from './NavegacaoCategoriasCards'

interface NavegacaoCategoriasCardsClientProps {
  estabelecimentoId: string
  slug: string
  /** Só pros placeholders do skeleton (nomes/quantidade) até o hook
   *  resolver — nunca tem foto, é só o formato do grid enquanto carrega. */
  categoriasServidor: { id: string }[]
  corS: string
  corBd: string
  cardRaio: string
}

/**
 * Wrapper client do grid de categorias (Cards) — mesma ideia de
 * FaixasCategorias/CategoriaItensClient: em vez da página principal
 * buscar `foto_url` de novo a cada navegação de volta pra cá (ida-e-volta
 * categoria → item → categoria de novo, o padrão de uso mais comum na
 * escolha dos itens), usa o cache persistente (useCardapioPublico) — id+
 * updated_at é checado na entrada, e as fotos só são rebuscadas se algo
 * realmente mudou; senão vem tudo do localStorage, sem consulta nenhuma.
 */
export default function NavegacaoCategoriasCardsClient({
  estabelecimentoId,
  slug,
  categoriasServidor,
  corS,
  corBd,
  cardRaio,
}: NavegacaoCategoriasCardsClientProps) {
  const { categorias, carregandoInicial } = useCardapioPublico({ estabelecimentoId })

  if (carregandoInicial) {
    return (
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categoriasServidor.map((cat) => (
          <div
            key={cat.id}
            className="aspect-[16/9] animate-pulse"
            style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: cardRaio }}
          />
        ))}
      </div>
    )
  }

  return <NavegacaoCategoriasCards slug={slug} categorias={categorias} corS={corS} corBd={corBd} cardRaio={cardRaio} />
}
