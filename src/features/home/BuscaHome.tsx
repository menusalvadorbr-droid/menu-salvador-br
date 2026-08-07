/**
 * Busca por texto livre (nome, bairro, tipo de culinária) — form GET puro
 * pra raiz do site, sem JS nenhum: submeter navega pra "/?q=...", que o
 * Grid geral (GridGeralSecao) lê de `searchParams` e usa pra decidir
 * entre a query padrão (ordenada por destaque) e a busca por relevância.
 * Os filtros de bairro/culinária (se já selecionados) vão como campos
 * escondidos, pra sobreviver à busca em vez de serem substituídos por ela.
 */
export default function BuscaHome({
  qInicial,
  bairroAtual,
  tipoAtual,
}: {
  qInicial?: string
  bairroAtual?: string
  tipoAtual?: string
}) {
  return (
    <form action="/" method="GET" className="mx-auto mt-6 flex max-w-lg gap-2">
      {bairroAtual && <input type="hidden" name="bairro" value={bairroAtual} />}
      {tipoAtual && <input type="hidden" name="tipo" value={tipoAtual} />}
      <input
        type="text"
        name="q"
        defaultValue={qInicial}
        placeholder="Busque por nome, bairro ou culinária…"
        className="w-full rounded-full border-0 bg-white/95 px-5 py-3 text-sm text-neutral-800 shadow-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/60"
      />
      <button
        type="submit"
        className="flex-shrink-0 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
      >
        Buscar
      </button>
    </form>
  )
}
