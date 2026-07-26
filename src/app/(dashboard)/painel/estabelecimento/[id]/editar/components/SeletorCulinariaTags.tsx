'use client'

interface TipoCozinha {
  id: number
  nome: string
  icone?: string | null
}

interface SeletorCulinariaTagsProps {
  todos: TipoCozinha[]
  selecionados: number[]
  onChange: (novos: number[]) => void
  max?: number
  disabled?: boolean
}

/**
 * Multi-select com tags: as culinárias escolhidas aparecem como
 * "chips" removíveis, e um <select> simples adiciona mais (até `max`).
 * Substitui a grade de botões que existia antes — mesmo dado
 * (estabelecimento_tipos_cozinha), visual diferente.
 */
export default function SeletorCulinariaTags({
  todos,
  selecionados,
  onChange,
  max = 3,
  disabled,
}: SeletorCulinariaTagsProps) {
  const selecionadosInfo = selecionados
    .map((id) => todos.find((t) => t.id === id))
    .filter((t): t is TipoCozinha => Boolean(t))
  const disponiveis = todos.filter((t) => !selecionados.includes(t.id))
  const atingiuMax = selecionados.length >= max

  function remover(id: number) {
    if (disabled) return
    onChange(selecionados.filter((s) => s !== id))
  }

  function adicionar(id: number) {
    if (disabled || atingiuMax) return
    onChange([...selecionados, id])
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {selecionadosInfo.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm text-orange-700"
          >
            {t.icone && <span>{t.icone}</span>}
            {t.nome}
            {!disabled && (
              <button
                type="button"
                onClick={() => remover(t.id)}
                className="ml-1 text-orange-400 hover:text-orange-700"
                aria-label={`Remover ${t.nome}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {selecionadosInfo.length === 0 && (
          <span className="text-sm text-gray-400">Nenhuma culinária selecionada ainda.</span>
        )}
      </div>

      {!disabled && (
        atingiuMax ? (
          <p className="text-xs text-gray-400">Máximo de {max} atingido — remova uma tag pra trocar.</p>
        ) : (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) adicionar(Number(e.target.value))
            }}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <option value="">+ Adicionar culinária ({selecionados.length}/{max})</option>
            {disponiveis.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icone ? `${t.icone} ` : ''}{t.nome}
              </option>
            ))}
          </select>
        )
      )}
    </div>
  )
}
