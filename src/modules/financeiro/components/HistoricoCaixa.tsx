'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listarSessoes } from '../caixaRepository'
import type { SessaoCaixa } from '../types'
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
        <thead className="border-b border-neutral-800 bg-neutral-900/70 text-left text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Abertura</th>
            <th className="px-4 py-2">Fechamento</th>
            <th className="px-4 py-2">Valor abertura</th>
            <th className="px-4 py-2">Valor fechamento</th>
            <th className="px-4 py-2">Diferença</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {sessoes.map((sessao) => (
            <tr
              key={sessao.id}
              onClick={() => router.push(`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessao.id}`)}
              className="cursor-pointer hover:bg-neutral-800/60"
            >
              <td className="px-4 py-2">
                {sessao.status === 'aberto' ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caixaTema.badgeSucesso}`}>Aberto</span>
                ) : (
                  <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-400">
                    Fechado
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-neutral-200">
                {new Date(sessao.aberto_em).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 text-neutral-500">
                {sessao.fechado_em ? new Date(sessao.fechado_em).toLocaleString('pt-BR') : '—'}
              </td>
              <td className="px-4 py-2 text-neutral-300">R$ {sessao.valor_abertura.toFixed(2)}</td>
              <td className="px-4 py-2 text-neutral-300">
                {sessao.valor_fechamento != null ? `R$ ${sessao.valor_fechamento.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-2">
                {sessao.diferenca != null ? (
                  <span
                    className={
                      sessao.diferenca === 0
                        ? 'text-emerald-400'
                        : sessao.diferenca > 0
                          ? 'text-sky-400'
                          : 'text-red-400'
                    }
                  >
                    R$ {sessao.diferenca.toFixed(2)}
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
