import { formatarReais } from '@/lib/moeda'
import type { CategoriaComItens, ItemCardapioGarcom } from './cardapioParaGarcom'
import type { EstilosGarcom } from './estilosGarcom'

// Grade de categorias começa mostrando só as primeiras — cardápio com
// muita categoria virava uma parede de blocos antes de chegar nos itens;
// "+ mais" revela o resto sob demanda.
const LIMITE_CATEGORIAS_VISIVEIS = 5

/**
 * Busca + grade de categorias + lista de itens do cardápio, pra
 * LancarPedidoGarcom.tsx — extraído porque é uma seção que não depende de
 * nada do desconto/pagamento/Pix, só do cardápio em si e de como filtrar
 * ele. Todos os cálculos derivados (itens filtrados, categorias visíveis)
 * moram aqui, não no componente pai.
 */
export default function SeletorCardapioGarcom({
  categorias,
  categoriaAtiva,
  buscaItem,
  mostrarTodasCategorias,
  estilos: c,
  onBuscaItemChange,
  onEscolherCategoria,
  onLimparCategoria,
  onToggleMostrarTodas,
  onAdicionarItem,
}: {
  categorias: CategoriaComItens[]
  categoriaAtiva: string | null
  buscaItem: string
  mostrarTodasCategorias: boolean
  estilos: EstilosGarcom
  onBuscaItemChange: (valor: string) => void
  onEscolherCategoria: (id: string) => void
  onLimparCategoria: () => void
  onToggleMostrarTodas: () => void
  onAdicionarItem: (item: ItemCardapioGarcom) => void
}) {
  const termoBusca = buscaItem.trim().toLowerCase()
  const categoriasFiltradas = categorias
    .filter((cat) => !categoriaAtiva || cat.id === categoriaAtiva)
    .map((cat) => ({
      ...cat,
      itens: termoBusca ? cat.itens.filter((item) => item.nome.toLowerCase().includes(termoBusca)) : cat.itens,
    }))
    .filter((cat) => cat.itens.length > 0)

  const podeExpandirCategorias = categorias.length > LIMITE_CATEGORIAS_VISIVEIS
  const categoriasNaGrade = mostrarTodasCategorias ? categorias : categorias.slice(0, LIMITE_CATEGORIAS_VISIVEIS)

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
        {/* Grade de categorias em vez de pílulas — alvo de toque maior,
            melhor pra um terminal de caixa usado com o dedo. "Todas" faz
            dois papéis: limpa o filtro de categoria (lista volta a mostrar
            item de todas) E expande/recolhe a grade quando há mais
            categorias do que cabe (LIMITE_CATEGORIAS_VISIVEIS) — antes eram
            dois botões (Todas + "+N mais"/"Mostrar menos"), unificados
            porque os dois só fazem sentido juntos: não tem porquê ver a
            grade cheia sem também limpar o filtro. Escolher uma categoria
            específica sempre recolhe a grade de volta (ver onClick abaixo),
            então "Mostrar menos" nunca aparece com uma categoria ativa. */}
        {categorias.length > 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              onClick={() => {
                onLimparCategoria()
                if (podeExpandirCategorias) onToggleMostrarTodas()
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                !categoriaAtiva ? c.botaoToggleAtivo : c.itemBotao
              }`}
            >
              {podeExpandirCategorias && mostrarTodasCategorias ? 'Mostrar menos' : 'Todas'}
              <span className="mt-0.5 block text-xs font-normal opacity-70">
                {podeExpandirCategorias && mostrarTodasCategorias
                  ? 'ver menos categorias'
                  : `${categorias.reduce((soma, cat) => soma + cat.itens.length, 0)} itens`}
              </span>
            </button>
            {categoriasNaGrade.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onEscolherCategoria(cat.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                  categoriaAtiva === cat.id ? c.botaoToggleAtivo : c.itemBotao
                }`}
              >
                {cat.nome}
                <span className="mt-0.5 block text-xs font-normal opacity-70">{cat.itens.length} itens</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {categoriasFiltradas.map((cat) => (
        <div key={cat.id} className="mb-4">
          <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${c.categoria}`}>{cat.nome}</h3>
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
        <p className={`py-8 text-center text-sm ${c.vazio}`}>
          {categorias.length === 0 ? 'Cardápio vazio.' : 'Nenhum item encontrado.'}
        </p>
      )}
    </>
  )
}
