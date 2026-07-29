import Link from 'next/link'

interface ModuloGestaoProps {
  estabelecimentoId: string
  ativado: boolean
}

const ITENS = [
  { slug: 'pedidos', label: '📋 Pedidos' },
  { slug: 'estoque', label: '📦 Estoque' },
  { slug: 'caixa', label: '💰 Caixa' },
  { slug: 'fornecedores', label: '🚚 Fornecedores' },
]

/**
 * Antes eram 4 links soltos no cabeçalho da tela de gerenciar. Viraram um
 * módulo à parte pra ficar simétrico com o módulo Cardápio — sempre
 * visível pra todo estabelecimento (não escondido), mas com aparência
 * apagada e sem clique até o dono ligar "Ativar módulo de Gestão" em
 * Configurações (GestaoTab.tsx), sinalizando que a função existe mas não
 * está em uso ainda.
 */
export default function ModuloGestao({ estabelecimentoId, ativado }: ModuloGestaoProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {!ativado && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          🔒 Módulo de Gestão desativado. Peça ao dono ou gerente pra ligar em Cardápio → Configurações → Módulo de
          Gestão.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {ITENS.map((item) =>
          ativado ? (
            <Link
              key={item.slug}
              href={`/painel/estabelecimento/${estabelecimentoId}/${item.slug}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-sm font-semibold text-neutral-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              {item.label}
            </Link>
          ) : (
            <div
              key={item.slug}
              aria-disabled="true"
              title="Módulo de Gestão desativado"
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm font-semibold text-neutral-400 opacity-50"
            >
              {item.label}
            </div>
          )
        )}
      </div>
    </div>
  )
}
