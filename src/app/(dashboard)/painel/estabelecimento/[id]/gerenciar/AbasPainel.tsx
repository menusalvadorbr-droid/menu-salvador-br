'use client'

/**
 * Pílulas de aba — mesmo estilo idêntico que Estoque e Fornecedores
 * repetiam cada um por conta própria. Caixa fica de fora de propósito: tem
 * visual de terminal escuro deliberadamente diferente do resto do painel
 * (ver comentário em caixa/page.tsx), não é a mesma família visual.
 */
export default function AbasPainel<T extends string>({
  abas,
  ativa,
  onChange,
}: {
  abas: { chave: T; label: string }[]
  ativa: T
  onChange: (chave: T) => void
}) {
  return (
    <div className="mt-4 flex gap-2">
      {abas.map((aba) => (
        <button
          key={aba.chave}
          onClick={() => onChange(aba.chave)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            ativa === aba.chave ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {aba.label}
        </button>
      ))}
    </div>
  )
}
