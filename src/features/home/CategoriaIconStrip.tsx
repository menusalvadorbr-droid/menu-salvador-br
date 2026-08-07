'use client'

interface TipoCozinha {
  id: number
  nome: string
  slug: string
  icone: string | null
}

interface CategoriaIconStripProps {
  tiposCozinha: TipoCozinha[]
  ativoId: number | null
  onSelecionar: (id: number | null) => void
}

/**
 * Faixa de ícones de categoria (estilo iFood/UberEats) — substitui o
 * dropdown de "tipo de cozinha" que existia antes por algo mais tátil
 * e rápido de usar no celular.
 *
 * Seleciona por `id` (não por `nome`) porque a filtragem real passa
 * pela tabela de junção estabelecimento_tipos_cozinha, que referencia
 * tipo_cozinha_id — ver GridGeralSecao/GridClient.
 */
export default function CategoriaIconStrip({ tiposCozinha, ativoId, onSelecionar }: CategoriaIconStripProps) {
  if (tiposCozinha.length === 0) return null

  return (
    <div className="border-b border-neutral-100 bg-white">
      <div className="container mx-auto flex gap-3 overflow-x-auto px-4 py-4">
        {tiposCozinha.map((t) => {
          const selecionado = ativoId === t.id
          return (
            <button
              key={t.id}
              onClick={() => onSelecionar(selecionado ? null : t.id)}
              className="flex flex-shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition ${
                  selecionado ? 'text-white shadow-md' : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
                style={selecionado ? { backgroundColor: 'var(--brand-primary)' } : undefined}
              >
                {t.icone || '🍽️'}
              </div>
              <span
                className={`text-xs font-medium ${selecionado ? '' : 'text-neutral-600'}`}
                style={selecionado ? { color: 'var(--brand-primary)' } : undefined}
              >
                {t.nome}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
