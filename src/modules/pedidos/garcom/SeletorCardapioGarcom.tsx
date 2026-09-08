import { ChevronLeft } from 'lucide-react'
import { formatarReais } from '@/lib/moeda'
import type { CategoriaComItens, ItemCardapioGarcom } from './cardapioParaGarcom'
import type { EstilosGarcom } from './estilosGarcom'

/**
 * Busca + navegação de categorias + lista de itens do cardápio, pra
 * LancarPedidoGarcom.tsx — extraído porque é uma seção que não depende de
 * nada do desconto/pagamento/Pix, só do cardápio em si e de como filtrar
 * ele. Todos os cálculos derivados (itens filtrados) moram aqui, não no
 * componente pai.
 *
 * Navegação em dois níveis (sem modo "todas de uma vez", que virava uma
 * lista enorme pra cardápio grande): categorias aparecem como cards; tocar
 * numa mostra só os itens dela. Buscar ignora esse nível — resultado da
 * busca sempre cruza todas as categorias, senão o operador precisaria
 * escolher a categoria certa antes de poder procurar um item.
 */
export default function SeletorCardapioGarcom({
  categorias,
  categoriaAtiva,
  buscaItem,
  estilos: c,
  onBuscaItemChange,
  onEscolherCategoria,
  onLimparCategoria,
  onAdicionarItem,
}: {
  categorias: CategoriaComItens[]
  categoriaAtiva: string | null
  buscaItem: string
  estilos: EstilosGarcom
  onBuscaItemChange: (valor: string) => void
  onEscolherCategoria: (id: string) => void
  onLimparCategoria: () => void
  onAdicionarItem: (item: ItemCardapioGarcom) => void
}) {
  const termoBusca = buscaItem.trim().toLowerCase()
  const emBusca = termoBusca.length > 0
  const categoriaSelecionada = categorias.find((cat) => cat.id === categoriaAtiva) || null

  const categoriasFiltradas = categorias
    .filter((cat) => emBusca || !categoriaAtiva || cat.id === categoriaAtiva)
    .map((cat) => ({
      ...cat,
      itens: emBusca ? cat.itens.filter((item) => item.nome.toLowerCase().includes(termoBusca)) : cat.itens,
    }))
    .filter((cat) => cat.itens.length > 0)

  const mostrarCardsDeCategoria = !emBusca && !categoriaAtiva

  return (
    <>
      <div className="mb-3 space-y-2">
        <input
          type="text"
          value={buscaItem}
          onChange={(e) => onBuscaItemChange(e.target.value)}
          placeholder="🔎 Buscar item ou código…"
          className={`w-full rounded-lg border px-3 py-2 text-sm ${c.input}`}
        />
        {/* Dentro de uma categoria (sem busca ativa) — botão de voltar pro
            grid de categorias, em vez de deixar uma tira de pílulas
            competindo com o cabeçalho da categoria. */}
        {!emBusca && categoriaSelecionada && (
          <button
            onClick={onLimparCategoria}
            className={`flex items-center gap-1 text-sm font-medium ${c.categoria} hover:opacity-80`}
          >
            <ChevronLeft className="h-4 w-4" /> Categorias
          </button>
        )}
      </div>

      {mostrarCardsDeCategoria ? (
        categorias.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onEscolherCategoria(cat.id)}
                className={`rounded-xl border px-3 py-4 text-left transition ${c.itemBotao}`}
              >
                <p className={`text-sm font-semibold ${c.itemNome}`}>{cat.nome}</p>
                <p className={`mt-0.5 text-xs opacity-70 ${c.categoria}`}>{cat.itens.length} itens</p>
              </button>
            ))}
          </div>
        ) : (
          <p className={`py-8 text-center text-sm ${c.vazio}`}>Cardápio vazio.</p>
        )
      ) : (
        <>
          {categoriasFiltradas.map((cat) => (
            <div key={cat.id} className="mb-4">
              {emBusca && (
                <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${c.categoria}`}>{cat.nome}</h3>
              )}
              <div className="flex flex-col gap-2">
                {cat.itens.map((item) => {
                  const preco = item.preco_promocional ?? item.preco
                  return (
                    <button
                      key={item.id}
                      onClick={() => onAdicionarItem(item)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${c.itemBotao}`}
                    >
                      <span className={c.itemNome}>{item.nome}</span>
                      <span className={`font-semibold ${c.itemPreco}`}>R$ {formatarReais(preco)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {categoriasFiltradas.length === 0 && (
            <p className={`py-8 text-center text-sm ${c.vazio}`}>Nenhum item encontrado.</p>
          )}
        </>
      )}
    </>
  )
}
