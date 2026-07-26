import Link from 'next/link'

const COR_TEXTO = '#2A2420'

export interface ItemEstabelecimento {
  nome: string
  slug: string
  status: string
  tipo: 'reivindicação' | 'cadastro direto'
}

const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
  active: { texto: 'Ativo', cor: '#1F7A4D' },
  em_analise: { texto: 'Em análise', cor: '#B8860B' },
  pending: { texto: 'Em análise', cor: '#B8860B' },
  approved: { texto: 'Aprovada', cor: '#1F7A4D' },
  rejected: { texto: 'Rejeitada', cor: '#A32D2D' },
}

export default function MeusEstabelecimentos({ itens }: { itens: ItemEstabelecimento[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-50" style={{ color: COR_TEXTO }}>
        Meus estabelecimentos
      </p>
      <p className="mb-3 text-xs opacity-60" style={{ color: COR_TEXTO }}>
        Inclui reivindicações antigas, mesmo as que não foram aprovadas.
      </p>

      {itens.length === 0 ? (
        <p className="rounded-lg bg-black/[0.02] px-4 py-3 text-sm opacity-50" style={{ color: COR_TEXTO }}>
          Nenhum estabelecimento ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {itens.map((item, i) => {
            const status = STATUS_LABEL[item.status] || { texto: item.status, cor: '#888' }
            return (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-black/5 px-3 py-2 text-sm"
              >
                <div>
                  <Link href={`/cardapio/${item.slug}`} className="font-medium hover:underline" style={{ color: COR_TEXTO }}>
                    {item.nome}
                  </Link>
                  <span className="ml-2 text-xs opacity-40" style={{ color: COR_TEXTO }}>{item.tipo}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: status.cor }}>{status.texto}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
