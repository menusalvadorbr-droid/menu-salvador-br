'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCaixa } from '../hooks/useCaixa'
import MesasComContaAberta from './MesasComContaAberta'
import VendaSessaoRow from './VendaSessaoRow'

export default function PainelCaixa({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { sessaoAberta, resumo, carregando, abrir, fechar } = useCaixa(estabelecimentoId)
  const [valorAbertura, setValorAbertura] = useState('')
  const [valorFechamento, setValorFechamento] = useState('')
  const [resultadoFechamento, setResultadoFechamento] = useState<{ diferenca: number } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const [erro, setErro] = useState<string | null>(null)

  async function handleAbrir() {
    setEnviando(true)
    setErro(null)
    try {
      await abrir(Number(valorAbertura) || 0)
      setValorAbertura('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao abrir o caixa')
    } finally {
      setEnviando(false)
    }
  }

  async function handleFechar() {
    setEnviando(true)
    setErro(null)
    try {
      const sessao = await fechar(Number(valorFechamento) || 0)
      if (sessao) setResultadoFechamento({ diferenca: sessao.diferenca || 0 })
      setValorFechamento('')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fechar o caixa')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando caixa...</div>
  }

  if (resultadoFechamento) {
    const { diferenca } = resultadoFechamento
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm">
        <div className="mb-2 text-4xl">{diferenca === 0 ? '✅' : diferenca > 0 ? '📈' : '📉'}</div>
        <h2 className="text-lg font-bold text-neutral-900">Caixa fechado</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {diferenca === 0
            ? 'Bateu certinho com o valor esperado.'
            : diferenca > 0
              ? `Sobrou R$ ${diferenca.toFixed(2)} em relação ao esperado.`
              : `Faltou R$ ${Math.abs(diferenca).toFixed(2)} em relação ao esperado.`}
        </p>
        <button
          onClick={() => setResultadoFechamento(null)}
          className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Voltar
        </button>
      </div>
    )
  }

  if (!sessaoAberta) {
    return (
      <div className="space-y-6">
        <MesasComContaAberta estabelecimentoId={estabelecimentoId} />
        <div className="mx-auto max-w-sm rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-4xl">🔒</div>
          <h2 className="text-lg font-bold text-neutral-900">Caixa fechado</h2>
          <p className="mt-1 text-sm text-neutral-500">Informe o valor inicial para abrir o caixa.</p>
          {erro && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
          <input
            type="number"
            value={valorAbertura}
            onChange={(e) => setValorAbertura(e.target.value)}
            placeholder="0,00"
            className="mt-4 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-center text-lg text-neutral-900"
          />
          <button
            onClick={handleAbrir}
            disabled={enviando}
            className="mt-3 w-full rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {enviando ? 'Abrindo...' : 'Abrir caixa'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MesasComContaAberta estabelecimentoId={estabelecimentoId} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <p className="text-xs font-semibold uppercase text-green-700">🟢 Caixa aberto</p>
        <p className="mt-1 text-sm text-neutral-600">
          Desde {new Date(sessaoAberta.aberto_em).toLocaleString('pt-BR')}
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          Valor de abertura: <span className="font-semibold">R$ {sessaoAberta.valor_abertura.toFixed(2)}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">Vendas nesta sessão</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900">
          R$ {(resumo?.totalVendas || 0).toFixed(2)}
        </p>
        <p className="text-xs text-neutral-400">{resumo?.quantidadePedidos || 0} pedidos pagos</p>

        {resumo && Object.keys(resumo.porMetodoPagamento).length > 0 && (
          <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
            {Object.entries(resumo.porMetodoPagamento).map(([metodo, valor]) => (
              <div key={metodo} className="flex justify-between">
                <span>{metodo}</span>
                <span>R$ {valor.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm md:col-span-2">
        <p className="mb-2 text-sm font-semibold text-neutral-700">Fechar caixa</p>
        {erro && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        <p className="mb-3 text-xs text-neutral-400">
          Valor esperado na gaveta: R$ {(sessaoAberta.valor_abertura + (resumo?.totalVendas || 0)).toFixed(2)}{' '}
          (abertura + vendas em dinheiro/cartão registradas)
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            value={valorFechamento}
            onChange={(e) => setValorFechamento(e.target.value)}
            placeholder="Valor contado na gaveta"
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"
          />
          <button
            onClick={handleFechar}
            disabled={enviando}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? 'Fechando...' : 'Fechar caixa'}
          </button>
        </div>
      </div>
      </div>

      {resumo && resumo.vendas.length > 0 && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-700">🧾 Vendas desta sessão</p>
            <Link
              href={`/painel/estabelecimento/${estabelecimentoId}/caixa/${sessaoAberta.id}`}
              className="text-xs font-medium text-orange-600 hover:underline"
            >
              Ver demonstrativo completo →
            </Link>
          </div>
          <p className="mb-3 text-xs text-neutral-400">Clique numa linha pra ver o detalhe.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
                <tr>
                  <th className="py-2 pr-3 font-medium">Horário</th>
                  <th className="py-2 pr-3 font-medium">Mesa</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Forma</th>
                  <th className="py-2 pl-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {resumo.vendas.map((venda) => (
                  <VendaSessaoRow key={`${venda.tipo}-${venda.id}`} venda={venda} caixaSessaoId={sessaoAberta.id} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
