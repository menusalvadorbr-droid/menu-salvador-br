'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listarSessoes } from '../caixaRepository'
import type { SessaoCaixa } from '../types'
import { formatarReais } from '@/lib/moeda'
import { caixaTema } from '../caixaTema'

export default function HistoricoCaixa({ estabelecimentoId }: { estabelecimentoId: string }) {
  const router = useRouter()
  const [sessoes, setSessoes] = useState<SessaoCaixa[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarSessoes(estabelecimentoId)
      .then(setSessoes)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  if (carregando) {
    return (
      <div className={`space-y-2 p-4 ${caixaTema.painel}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`h-10 ${caixaTema.skeleton}`} />
        ))}
      </div>
    )
  }

  return (
    <div className={`overflow-hidden ${caixaTema.painel}`}>
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Abertura</th>
            <th className="px-4 py-2">Fechamento</th>
            <th className="px-4 py-2">Valor abertura</th>
            <th className="px-4 py-2">Valor fechamento</th>
            <th className="px-4 py-2">Diferença</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {sessoes.map((sessao) => (
            <tr
              key={sessao.id}
              onClick={() => router.push(`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessao.id}`)}
              className="cursor-pointer hover:bg-neutral-50"
            >
              <td className="px-4 py-2">
                {sessao.status === 'aberto' ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caixaTema.badgeSucesso}`}>Aberto</span>
                ) : (
                  <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                    Fechado
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-neutral-800">
                {new Date(sessao.aberto_em).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 text-neutral-500">
                {sessao.fechado_em ? new Date(sessao.fechado_em).toLocaleString('pt-BR') : '—'}
              </td>
              <td className="px-4 py-2 text-neutral-700">R$ {formatarReais(sessao.valor_abertura)}</td>
              <td className="px-4 py-2 text-neutral-700">
                {sessao.valor_fechamento != null ? `R$ ${formatarReais(sessao.valor_fechamento)}` : '—'}
              </td>
              <td className="px-4 py-2">
                {sessao.diferenca != null ? (
                  <span
                    className={
                      sessao.diferenca === 0
                        ? 'text-emerald-600'
                        : sessao.diferenca > 0
                          ? 'text-sky-600'
                          : 'text-red-600'
                    }
                  >
                    R$ {formatarReais(sessao.diferenca)}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
          {sessoes.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500">
                Nenhuma sessão de caixa ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
