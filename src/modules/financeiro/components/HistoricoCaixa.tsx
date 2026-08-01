'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listarSessoes } from '../caixaRepository'
import type { SessaoCaixa } from '../types'

export default function HistoricoCaixa({ estabelecimentoId }: { estabelecimentoId: string }) {
  const router = useRouter()
  const [sessoes, setSessoes] = useState<SessaoCaixa[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    listarSessoes(estabelecimentoId)
      .then(setSessoes)
      .finally(() => setCarregando(false))
  }, [estabelecimentoId])

  if (carregando) return <div className="py-8 text-center text-neutral-400">Carregando histórico...</div>

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase text-neutral-400">
          <tr>
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
              <td className="px-4 py-2 text-neutral-700">
                {new Date(sessao.aberto_em).toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-2 text-neutral-500">
                {sessao.fechado_em ? new Date(sessao.fechado_em).toLocaleString('pt-BR') : '—'}
              </td>
              <td className="px-4 py-2">R$ {sessao.valor_abertura.toFixed(2)}</td>
              <td className="px-4 py-2">
                {sessao.valor_fechamento != null ? `R$ ${sessao.valor_fechamento.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-2">
                {sessao.diferenca != null ? (
                  <span className={sessao.diferenca === 0 ? 'text-green-600' : sessao.diferenca > 0 ? 'text-blue-600' : 'text-red-600'}>
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
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-400">
                Nenhuma sessão de caixa ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
