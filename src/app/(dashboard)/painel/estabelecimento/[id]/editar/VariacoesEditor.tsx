import type { VariacaoItem } from './cardapioTipos'

// ─────────────────────────────────────────────
// VARIAÇÕES DE TAMANHO/PREÇO (fase 1 do módulo cardápio) — editor
// progressivo: fechado por padrão atrás de um link, não polui o formulário
// de item pra quem não usa. Abre sozinho quando o item editado já tem
// alguma variação configurada (ver `mostrar`, controlado pelo ModalItem).
// ─────────────────────────────────────────────
export default function VariacoesEditor({
  ativado, mostrar, setMostrar, variacoes, adicionarVariacao, atualizarVariacao, removerVariacao,
}: {
  ativado: boolean
  mostrar: boolean
  setMostrar: (v: boolean) => void
  variacoes: VariacaoItem[]
  adicionarVariacao: () => void
  atualizarVariacao: (index: number, campo: 'nome' | 'preco', valor: string) => void
  removerVariacao: (index: number) => void
}) {
  if (!ativado) return null

  if (!mostrar) {
    return (
      <button
        type="button"
        onClick={() => setMostrar(true)}
        className="text-xs font-medium text-orange-600 hover:underline"
      >
        + Adicionar tamanhos
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 p-3 space-y-2">
      <label className="block text-xs font-medium text-gray-600">
        Tamanhos/variações <span className="text-gray-400 font-normal">(opcional — ex: Pequena, Média, Grande)</span>
      </label>
      {variacoes.map((v, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={v.nome}
            onChange={(e) => atualizarVariacao(i, 'nome', e.target.value)}
            placeholder="Nome (ex: Grande)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
          />
          <div className="relative w-28">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">R$</span>
            <input
              value={v.preco}
              onChange={(e) => atualizarVariacao(i, 'preco', e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>
          <button
            type="button"
            onClick={() => removerVariacao(i)}
            className="text-gray-400 hover:text-red-500 transition px-1"
            title="Remover"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={adicionarVariacao}
        className="text-xs font-medium text-orange-600 hover:underline"
      >
        + Adicionar tamanho
      </button>
    </div>
  )
}
